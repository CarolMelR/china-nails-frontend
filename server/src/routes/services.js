import { Router } from 'express'
import { pool } from '../database.js'

export const servicesRouter = Router()

servicesRouter.get('/', async (_request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT codigo_servicio AS serviceCode, nombre AS name,
              duracion_minutos AS durationMinutes, precio AS price
       FROM servicios WHERE activo = TRUE ORDER BY nombre`,
    )
    response.json({
      services: rows.map((service) => ({
        ...service,
        durationMinutes: Number(service.durationMinutes),
        price: Number(service.price),
      })),
    })
  } catch (error) {
    next(error)
  }
})
