import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'

const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'ADMIN_USERNAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_NAME', 'ADMIN_PHONE']
const missing = required.filter((key) => !process.env[key])

if (missing.length > 0) {
  throw new Error(`Faltan variables para crear la cuenta administradora: ${missing.join(', ')}`)
}

if (process.env.ADMIN_PASSWORD.length < 10) {
  throw new Error('ADMIN_PASSWORD debe tener al menos 10 caracteres.')
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
})

try {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)
  await connection.execute(
    `INSERT INTO usuarios
       (nombre_usuario, correo, hash_contrasena, nombre_completo, telefono, rol)
     VALUES (?, ?, ?, ?, ?, 'admin')`,
    [
      process.env.ADMIN_USERNAME,
      process.env.ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      process.env.ADMIN_NAME,
      process.env.ADMIN_PHONE,
    ],
  )
  console.log(`Cuenta administradora creada: ${process.env.ADMIN_USERNAME}`)
} finally {
  await connection.end()
}
