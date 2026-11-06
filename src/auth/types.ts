export type UserRole = 'admin' | 'client'

export interface AuthenticatedUser {
  id: number
  username: string
  email: string
  displayName: string
  phone: string
  role: UserRole
}

export interface RegisterDetails {
  username: string
  email: string
  password: string
  fullName: string
  phone: string
}
