import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../database.js'
import { authenticate } from '../middleware/authenticate.js'
import { config } from '../config.js'

export const authRouter = Router()

const publicUser = (user) => ({
  id: user.user_id,
  username: user.username,
  email: user.email,
  displayName: user.full_name,
  phone: user.phone,
  role: user.role,
})

const createToken = (user) =>
  jwt.sign(
    {
      sub: String(user.user_id),
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: '8h' },
  )

authRouter.post('/register', async (request, response, next) => {
  const { username, email, password, fullName, phone } = request.body ?? {}

  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof fullName !== 'string' ||
    typeof phone !== 'string' ||
    username.trim().length < 3 ||
    username.trim().length > 50 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length < 10 ||
    fullName.trim().length < 2 ||
    fullName.trim().length > 120 ||
    phone.trim().length < 7 ||
    phone.trim().length > 30
  ) {
    response.status(400).json({
      message:
        'Revisa tus datos: el usuario debe tener al menos 3 caracteres, la contraseña 10, y correo, nombre y teléfono deben ser válidos.',
    })
    return
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const connection = await pool.getConnection()
    let user
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute(
        `INSERT INTO usuarios
           (nombre_usuario, correo, hash_contrasena, nombre_completo, telefono)
         VALUES (?, ?, ?, ?, ?)`,
        [
          username.trim(),
          email.trim().toLowerCase(),
          passwordHash,
          fullName.trim(),
          phone.trim(),
        ],
      )
      user = {
        user_id: result.insertId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: 'client',
      }
      await connection.execute(
        'INSERT INTO perfiles_clientas (id_clienta) VALUES (?)',
        [user.user_id],
      )
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

    response.status(201).json({ user: publicUser(user), token: createToken(user) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      response.status(409).json({
        message: 'Ese nombre de usuario o correo electrónico ya está registrado.',
      })
      return
    }
    next(error)
  }
})

authRouter.post('/login', async (request, response, next) => {
  const { username, password } = request.body ?? {}
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password
  ) {
    response.status(400).json({ message: 'Ingresa tu usuario y contraseña.' })
    return
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id_usuario AS user_id, nombre_usuario AS username,
              correo AS email, hash_contrasena AS password_hash,
              nombre_completo AS full_name, telefono AS phone, rol AS role
       FROM usuarios
       WHERE nombre_usuario = ? AND activo = TRUE LIMIT 1`,
      [username.trim()],
    )
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      response.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
      return
    }

    response.json({ user: publicUser(user), token: createToken(user) })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', authenticate, async (request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id_usuario AS user_id, nombre_usuario AS username,
              correo AS email, nombre_completo AS full_name,
              telefono AS phone, rol AS role
       FROM usuarios WHERE id_usuario = ? AND activo = TRUE LIMIT 1`,
      [request.user.sub],
    )
    if (!rows[0]) {
      response.status(401).json({ message: 'La cuenta no está disponible.' })
      return
    }
    response.json({ user: publicUser(rows[0]) })
  } catch (error) {
    next(error)
  }
})
