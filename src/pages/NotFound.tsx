import type { FC } from 'react'
import { Link } from 'react-router-dom'

export const NotFound: FC = () => (
  <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-16">
    <section className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
        Página no encontrada
      </h1>
      <p className="mt-3 text-stone-600">
        La dirección que buscas no existe o fue movida.
      </p>
      <Link
        className="mt-6 inline-flex rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800"
        to="/"
      >
        Volver al inicio
      </Link>
    </section>
  </main>
)
