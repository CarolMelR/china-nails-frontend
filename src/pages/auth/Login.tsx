import { useState, type FC, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import { useAuth } from '../../auth/useAuth'

export const Login: FC = () => {
  const navigate = useNavigate()
  const { signIn, user, ready } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return (
      <Navigate
        replace
        to={user.role === 'admin' ? '/admin' : '/cliente'}
      />
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const role = await signIn(username.trim(), password)
      navigate(role === 'admin' ? '/admin' : '/cliente', { replace: true })
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiError || submissionError instanceof Error
          ? submissionError.message
          : 'No fue posible iniciar sesión.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!ready) {
    return <main className="p-12 text-center text-stone-600">Cargando…</main>
  }

  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-4 py-12">
      <Link
        className="absolute left-4 top-4 z-10 rounded-full border border-rose-200 bg-white/90 px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-50"
        to="/"
      >
        Inicio
      </Link>
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-rose-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-violet-900/20 blur-3xl" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-rose-950/10 ring-1 ring-rose-100 md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden min-h-[600px] overflow-hidden bg-[#160d24] p-10 md:flex md:flex-col md:justify-between">
          <div className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-violet-800/60 blur-sm" />
          <div className="absolute -bottom-16 -left-20 h-80 w-80 rounded-full bg-fuchsia-700/30 blur-sm" />
          <p className="relative font-serif text-xl font-semibold text-[#f1e8ff]">
            China Nails
          </p>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-900/70">
              Tu espacio de belleza
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-tight text-[#402b35]">
              Un detalle que cambia todo.
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#c7b9d8]">
              Agenda tu visita y disfruta un momento hecho para ti.
            </p>
          </div>
          <span className="relative text-xs tracking-wider text-[#c7b9d8]">
            CUIDADO · ESTILO · BIENESTAR
          </span>
        </div>

        <div className="p-7 sm:p-10 md:p-12">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
              Bienvenida
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#402b35]">
              Inicia sesión
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Ingresa tus datos para continuar.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-stone-700"
                htmlFor="username"
              >
                Usuario
              </label>
              <input
                autoComplete="username"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                id="username"
                name="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Tu usuario"
                required
                value={username}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-stone-700"
                htmlFor="password"
              >
                Contraseña
              </label>
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                required
                type="password"
                value={password}
              />
            </div>

            {error && (
              <p
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              className="w-full rounded-xl bg-rose-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/15 transition hover:bg-rose-950 focus:outline-none focus:ring-4 focus:ring-rose-500/25 disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-stone-600">
            ¿Aún no tienes cuenta?{' '}
            <Link className="font-semibold text-rose-800 hover:text-rose-950" to="/registro">
              Crear cuenta
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
