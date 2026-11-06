import { createContext } from 'react'
import type { AuthenticatedUser, RegisterDetails, UserRole } from './types'

export interface AuthContextValue {
  user: AuthenticatedUser | null
  ready: boolean
  authError: string
  signIn: (username: string, password: string) => Promise<UserRole>
  register: (details: RegisterDetails) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
