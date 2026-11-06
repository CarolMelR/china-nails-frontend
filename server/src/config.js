import 'dotenv/config'

const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET']
const missing = required.filter((key) => !process.env[key])

if (missing.length > 0) {
  throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`)
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres.')
}
if (process.env.JWT_SECRET.startsWith('REEMPLAZA_')) {
  throw new Error('Configura JWT_SECRET con un secreto aleatorio antes de iniciar la API.')
}

export const config = {
  port: Number(process.env.API_PORT || 3001),
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    dateStrings: true,
  },
  jwtSecret: process.env.JWT_SECRET,
}
