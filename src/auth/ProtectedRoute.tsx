import type { FC, PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import type { UserRole } from './types'
import { useAuth } from './useAuth'

interface ProtectedRouteProps extends PropsWithChildren {
  role: UserRole
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  role,
}) => {
  const { user, ready, authError } = useAuth()

  if (!ready) {
    return <div className="p-10 text-center text-stone-600">Validando sesión…</div>
  }

  if (authError) {
    return (
      <div className="p-10 text-center text-red-700" role="alert">
        {authError}
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to="/login" />
  }

  if (user.role !== role) {
    return <Navigate replace to={user.role === 'admin' ? '/admin' : '/cliente'} />
  }

  return children
}
