import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export const authenticate = (request, response, next) => {
  const authorization = request.get('authorization')
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null

  if (!token) {
    response.status(401).json({ message: 'Inicia sesión para continuar.' })
    return
  }

  try {
    request.user = jwt.verify(token, config.jwtSecret)
    next()
  } catch {
    response.status(401).json({ message: 'La sesión expiró. Inicia sesión de nuevo.' })
  }
}

export const requireRole = (role) => (request, response, next) => {
  if (request.user.role !== role) {
    response.status(403).json({ message: 'No tienes permiso para esta acción.' })
    return
  }

  next()
}
