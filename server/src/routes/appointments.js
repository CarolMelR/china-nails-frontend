import { Router } from 'express'
import { pool } from '../database.js'
import { authenticate, requireRole } from '../middleware/authenticate.js'

export const appointmentsRouter = Router()

appointmentsRouter.use(authenticate)

appointmentsRouter.get('/availability', async (request, response, next) => {
  const { date } = request.query
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    response.status(400).json({ message: 'Indica una fecha válida.' })
    return
  }

  try {
    const [rows] = await pool.execute(
      `SELECT TIME_FORMAT(hora_inicio, '%H:%i') AS time
       FROM citas
       WHERE fecha_cita = ? AND estado IN ('pending', 'confirmed')`,
      [date],
    )
    response.json({ reservedTimes: rows.map((row) => row.time) })
  } catch (error) {
    next(error)
  }
})

appointmentsRouter.get('/mine', requireRole('client'), async (request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id_cita AS id, a.fecha_cita AS date,
              TIME_FORMAT(a.hora_inicio, '%H:%i') AS time,
              a.duracion_minutos AS durationMinutes,
              a.precio_reservado AS price, a.estado AS status,
              s.nombre AS service, u.nombre_completo AS clientName,
              u.telefono AS phone
       FROM citas a
       JOIN usuarios u ON u.id_usuario = a.id_clienta
       JOIN servicios s ON s.codigo_servicio = a.codigo_servicio
       WHERE a.id_clienta = ?
       ORDER BY a.fecha_cita DESC, a.hora_inicio DESC`,
      [request.user.sub],
    )
    response.json({
      appointments: rows.map((appointment) => ({
        ...appointment,
        id: String(appointment.id),
        durationMinutes: Number(appointment.durationMinutes),
        price: Number(appointment.price),
      })),
    })
  } catch (error) {
    next(error)
  }
})

appointmentsRouter.get('/', requireRole('admin'), async (_request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id_cita AS id, a.fecha_cita AS date,
              TIME_FORMAT(a.hora_inicio, '%H:%i') AS time,
              a.duracion_minutos AS durationMinutes,
              a.precio_reservado AS price, a.estado AS status,
              s.nombre AS service, u.nombre_completo AS clientName,
              u.telefono AS phone
       FROM citas a
       JOIN usuarios u ON u.id_usuario = a.id_clienta
       JOIN servicios s ON s.codigo_servicio = a.codigo_servicio
       ORDER BY a.fecha_cita, a.hora_inicio`,
    )
    response.json({
      appointments: rows.map((appointment) => ({
        ...appointment,
        id: String(appointment.id),
        durationMinutes: Number(appointment.durationMinutes),
        price: Number(appointment.price),
      })),
    })
  } catch (error) {
    next(error)
  }
})

appointmentsRouter.patch('/:appointmentId/confirm', requireRole('admin'), async (request, response, next) => {
  const { appointmentId } = request.params
  if (!/^[1-9]\d*$/.test(appointmentId)) {
    response.status(400).json({ message: 'La cita indicada no es válida.' })
    return
  }

  try {
    const [result] = await pool.execute(
      `UPDATE citas SET estado = 'confirmed'
       WHERE id_cita = ? AND estado = 'pending'`,
      [appointmentId],
    )
    if (result.affectedRows === 0) {
      const [rows] = await pool.execute(
        'SELECT estado FROM citas WHERE id_cita = ? LIMIT 1',
        [appointmentId],
      )
      if (rows.length === 0) {
        response.status(404).json({ message: 'No se encontró la cita.' })
        return
      }
      response.status(409).json({
        message: 'La cita ya no está pendiente de confirmación.',
      })
      return
    }

    response.json({
      id: appointmentId,
      status: 'confirmed',
      message: 'La cita fue confirmada.',
    })
  } catch (error) {
    next(error)
  }
})

appointmentsRouter.post('/', requireRole('client'), async (request, response, next) => {
  const { serviceCode, date, time } = request.body ?? {}
  if (
    typeof serviceCode !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ||
    !/^(10:00|11:30|13:00|15:00|16:30)$/.test(time ?? '')
  ) {
    response.status(400).json({ message: 'Selecciona un servicio, fecha y horario válidos.' })
    return
  }

  const [year, month, day] = date.split('-').map(Number)
  const normalizedDate = new Date(Date.UTC(year, month - 1, day))
  if (normalizedDate.toISOString().slice(0, 10) !== date) {
    response.status(400).json({ message: 'La fecha de la cita no es válida.' })
    return
  }

  let connection
  let lockAcquired = false
  try {
    connection = await pool.getConnection()
    const [todayRows] = await connection.execute(
      'SELECT DATE_FORMAT(CURDATE(), "%Y-%m-%d") AS today',
    )
    if (date < todayRows[0].today) {
      response.status(400).json({ message: 'La fecha de la cita no puede ser anterior a hoy.' })
      return
    }
    const lockName = `china-nails:${date}`
    const [lockRows] = await connection.execute(
      'SELECT GET_LOCK(?, 5) AS acquired',
      [lockName],
    )
    lockAcquired = Number(lockRows[0]?.acquired) === 1
    if (!lockAcquired) {
      response.status(409).json({
        message: 'No se pudo reservar el horario en este momento. Inténtalo de nuevo.',
      })
      return
    }

    await connection.beginTransaction()
    const [services] = await connection.execute(
      `SELECT codigo_servicio AS service_code,
              duracion_minutos AS duration_minutes, precio AS price
       FROM servicios
       WHERE codigo_servicio = ? AND activo = TRUE LIMIT 1`,
      [serviceCode],
    )
    const service = services[0]
    if (!service) {
      await connection.rollback()
      response.status(404).json({ message: 'El servicio seleccionado ya no está disponible.' })
      return
    }

    const [conflicts] = await connection.execute(
      `SELECT id_cita
       FROM citas
       WHERE fecha_cita = ?
         AND estado IN ('pending', 'confirmed')
         AND TIME_TO_SEC(hora_inicio) < TIME_TO_SEC(?) + ? * 60
         AND TIME_TO_SEC(hora_inicio) + duracion_minutos * 60 > TIME_TO_SEC(?)
       LIMIT 1`,
      [date, time, service.duration_minutes, time],
    )
    if (conflicts.length > 0) {
      await connection.rollback()
      response.status(409).json({ message: 'Ese horario ya no está disponible. Elige otro.' })
      return
    }

    const [result] = await connection.execute(
      `INSERT INTO citas
         (id_clienta, codigo_servicio, fecha_cita, hora_inicio,
          duracion_minutos, precio_reservado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        request.user.sub,
        service.service_code,
        date,
        time,
        service.duration_minutes,
        service.price,
      ],
    )
    await connection.commit()
    response.status(201).json({ id: String(result.insertId), message: 'Cita registrada.' })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
    next(error)
  } finally {
    if (connection) {
      if (lockAcquired) {
        await connection.execute('SELECT RELEASE_LOCK(?)', [`china-nails:${date}`])
      }
      connection.release()
    }
  }
})
