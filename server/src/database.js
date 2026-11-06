import mysql from 'mysql2/promise'
import { config } from './config.js'

export const pool = mysql.createPool(config.database)

export const verifyDatabaseConnection = async () => {
  const connection = await pool.getConnection()
  try {
    await connection.ping()
  } finally {
    connection.release()
  }
}
