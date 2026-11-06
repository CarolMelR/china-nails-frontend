import express from 'express'
import { config } from './config.js'
import { pool, verifyDatabaseConnection } from './database.js'
import { appointmentsRouter } from './routes/appointments.js'
import { authRouter } from './routes/auth.js'
import { servicesRouter } from './routes/services.js'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '20kb' }))

app.get('/api/health', async (_request, response, next) => {
  try {
    await verifyDatabaseConnection()
    response.json({ status: 'ok', database: config.database.database })
  } catch (error) {
    next(error)
  }
})

app.use('/api/auth', authRouter)
app.use('/api/services', servicesRouter)
app.use('/api/appointments', appointmentsRouter)

app.use((error, _request, response, _next) => {
  console.error('API request failed:', error)
  response.status(500).json({
    message: 'Ocurrió un error interno. Revisa la conexión y los registros del servidor.',
  })
})

const start = async () => {
  try {
    await verifyDatabaseConnection()
    app.listen(config.port, () => {
      console.log(`API China Nails disponible en http://localhost:${config.port}`)
      console.log(`Base de datos conectada: ${config.database.database}`)
    })
  } catch (error) {
    console.error('No se pudo iniciar la API. Verifica MySQL y las variables de .env.', error)
    process.exitCode = 1
    await pool.end()
  }
}

start()
