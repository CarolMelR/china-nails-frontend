import type { FC } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export const AdminLayout: FC = () => {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#fbf4f1] text-[#f1e8ff]">
      <header className="admin-layout-header flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-white/80 px-6 py-3 sm:px-10">
        <span className="font-serif text-xl font-semibold">China Nails</span>
        <div className="admin-layout-header-actions flex items-center gap-3">
          <nav aria-label="Navegación administrativa" className="admin-layout-header-nav flex items-center gap-2">
            <Link
              className="rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-50"
              to="/admin"
            >
              Panel
            </Link>
            <Link
              className="rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-50"
              to="/admin/agenda"
            >
              Historial
            </Link>
            <Link
              className="rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-50"
              to="/admin/finanzas"
            >
              Finanzas
            </Link>
          </nav>
          <Link
            className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-50"
            to="/"
          >
            Inicio
          </Link>
          <button
            className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-50"
            onClick={handleSignOut}
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="admin-layout-main mx-auto min-h-[calc(100vh-72px)] w-full max-w-screen-2xl px-6 py-12 sm:px-10">
        <Outlet />
      </main>
    </div>
  )
}
