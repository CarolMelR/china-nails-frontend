import { useEffect, useState, type FC, type PropsWithChildren } from 'react'
import { ApiError, apiRequest, AUTH_TOKEN_KEY } from '../lib/api'
import { AuthContext } from './AuthContext'
import type { AuthenticatedUser, RegisterDetails, UserRole } from './types'

interface AuthResponse {
  user: AuthenticatedUser
  token: string
}

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [ready, setReady] = useState(
    () => !sessionStorage.getItem(AUTH_TOKEN_KEY),
  )
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      return
    }

    let cancelled = false
    apiRequest<{ user: AuthenticatedUser }>('/auth/me')
      .then(({ user: activeUser }) => {
        if (!cancelled) {
          setUser(activeUser)
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }
        if (error instanceof ApiError && error.status === 401) {
          sessionStorage.removeItem(AUTH_TOKEN_KEY)
          return
        }
        setAuthError(
          error instanceof Error
            ? error.message
            : 'No fue posible validar la sesión.',
        )
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const storeSession = (response: AuthResponse) => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, response.token)
    setUser(response.user)
    setAuthError('')
  }

  const signIn = async (
    username: string,
    password: string,
  ): Promise<UserRole> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    storeSession(response)
    return response.user.role
  }

  const register = async (details: RegisterDetails) => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    })
    storeSession(response)
  }

  const signOut = () => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    setUser(null)
    setAuthError('')
  }

  return (
    <AuthContext.Provider
      value={{ user, ready, authError, signIn, register, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
