import type { FC } from 'react'
import { Link, Outlet } from 'react-router-dom'

export const PublicLayout: FC = () => (
  <div className="min-h-screen bg-[#fff8f6] text-stone-900">
    <header className="border-b border-rose-100 bg-white/90">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link className="font-serif text-xl font-semibold tracking-tight" to="/">
          China Nails
        </Link>
        <Link
          className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-800 transition hover:bg-rose-50"
          to="/login"
        >
          Iniciar sesión
        </Link>
      </div>
    </header>
    <main>
      <Outlet />
    </main>
  </div>
)
