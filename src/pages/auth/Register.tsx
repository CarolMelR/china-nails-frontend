import { useState, type FC, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export const Register: FC = () => {
  const navigate = useNavigate()
  const { register, user, ready } = useAuth()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
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

  if (!ready) {
    return <main className="p-12 text-center text-stone-600">Cargando…</main>
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      })
      navigate('/cliente', { replace: true })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'No fue posible crear la cuenta.',
      )
    } finally {
      setIsSubmitting(false)
    }
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
        <div className="relative hidden min-h-[650px] overflow-hidden bg-[#160d24] p-10 md:flex md:flex-col md:justify-between">
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
              Tu próxima cita comienza aquí.
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#c7b9d8]">
              Crea tu cuenta para reservar y gestionar tus visitas.
            </p>
          </div>
          <span className="relative text-xs tracking-wider text-[#c7b9d8]">
            CUIDADO · ESTILO · BIENESTAR
          </span>
        </div>

        <div className="p-7 sm:p-10 md:p-12">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
              Registro de clienta
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#402b35]">
              Crear una cuenta
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Completa tus datos para comenzar a reservar.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="full-name">
                Nombre completo
              </label>
              <input
                autoComplete="name"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                id="full-name"
                maxLength={120}
                minLength={2}
                onChange={(event) => setFullName(event.target.value)}
                required
                value={fullName}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="register-username">
                  Usuario
                </label>
                <input
                  autoComplete="username"
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  id="register-username"
                  maxLength={50}
                  minLength={3}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  value={username}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="register-phone">
                  Teléfono
                </label>
                <input
                  autoComplete="tel"
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  id="register-phone"
                  maxLength={30}
                  minLength={7}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  type="tel"
                  value={phone}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="register-email">
                Correo electrónico
              </label>
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                id="register-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700" htmlFor="register-password">
                Contraseña
              </label>
              <input
                autoComplete="new-password"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                id="register-password"
                minLength={10}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <p className="mt-1 text-xs text-stone-500">Usa al menos 10 caracteres.</p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <button
              className="w-full rounded-xl bg-rose-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/15 transition hover:bg-rose-950 disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            ¿Ya tienes cuenta?{' '}
            <Link className="font-semibold text-rose-800 hover:text-rose-950" to="/login">
              Inicia sesión
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
