import { useEffect, useState, type FC } from 'react'
import { Link } from 'react-router-dom'

interface DatabaseConnectionResponse {
  success: boolean
  message: string
}

const whatsappUrl = new URL('https://wa.me/525535177179')
whatsappUrl.searchParams.set(
  'text',
  'Hola, me gustaría obtener más información sobre sus servicios de uñas.',
)

export const Home: FC = () => {
  const [connectionState, setConnectionState] = useState<
    'checking' | 'connected' | 'error'
  >('checking')

  useEffect(() => {
    let cancelled = false

    fetch('http://localhost/china-nails-api/conexion.php')
      .then(async (response) => {
        const result = (await response.json()) as DatabaseConnectionResponse
        if (!response.ok || !result.success) {
          throw new Error(result.message)
        }
        return result
      })
      .then(() => {
        if (!cancelled) {
          setConnectionState('connected')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConnectionState('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <div className="max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-rose-700">
            Un momento solo para ti
          </p>
          <h1 className="font-serif text-5xl leading-[1.08] tracking-tight text-[#402b35] sm:text-6xl">
            El mejor cuidado para tus uñas.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-stone-600">
            Elige tu servicio, consulta el precio y prepara tu próxima visita a
            China Nails.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-full bg-rose-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/15 transition hover:-translate-y-0.5 hover:bg-rose-950"
              to="/login"
            >
              Reserva tu cita
            </Link>
            <Link
              className="inline-flex rounded-full border border-rose-300 bg-white/70 px-6 py-3 text-sm font-semibold text-rose-950 transition hover:bg-white"
              to="/registro"
            >
              Crear una cuenta
            </Link>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[350px] flex-col gap-3">
          <div className="aspect-square w-full overflow-hidden rounded-[2rem] bg-[#fbe0e0] shadow-xl shadow-rose-950/10">
            <img
              alt="Logotipo de China Nails"
              className="h-full w-full object-cover"
              height={380}
              src="/china-nails-logo.png"
              width={380}
            />
          </div>
          <div className="rounded-2xl bg-white/90 px-5 py-3 shadow-lg">
            <p className="font-serif text-lg text-[#402b35]">
              Belleza en cada detalle
            </p>
            <p className="mt-1 text-xs text-stone-600">Tu cita, a tu manera</p>
          </div>
        </div>
      </section>
      <footer className="border-t border-rose-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-2 lg:px-10">
          <section>
            <h2 className="font-serif text-lg font-semibold text-[#402b35]">
              Ubicación
            </h2>
            <address className="mt-3 text-sm not-italic leading-6 text-stone-600">
              Blvd. Coacalco 390, San Francisco Coacalco, Estado de México.
            </address>
          </section>
          <section>
            <h2 className="font-serif text-lg font-semibold text-[#402b35]">
              Contacto
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li>
                Teléfono:{' '}
                <a
                  className="transition hover:text-rose-800"
                  href="tel:+525518554735"
                >
                  55 1855 4735
                </a>
              </li>
              <li>
                Correo:{' '}
                <a
                  className="transition hover:text-rose-800"
                  href="mailto:alegranados93@gmail.com"
                >
                  alegranados93@gmail.com
                </a>
              </li>
            </ul>
            <a
              aria-label="Enviar mensaje por WhatsApp al 55 3517 7179"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1DA851] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128C7E]"
              href={whatsappUrl.toString()}
              rel="noopener noreferrer"
              target="_blank"
            >
              Enviar mensaje por WhatsApp
            </a>
          </section>
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-6 lg:px-10">
          <p
            aria-live="polite"
            className={`rounded-xl px-4 py-3 text-sm ${
              connectionState === 'connected'
                ? 'bg-emerald-50 text-emerald-800'
                : connectionState === 'error'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-stone-50 text-stone-600'
            }`}
            role="status"
          >
            {connectionState === 'checking'
              ? 'Verificando conexión con la base de datos…'
              : connectionState === 'connected'
                ? 'Conexión con la base de datos: activa.'
                : 'No se pudo conectar con la base de datos. Verifica XAMPP, la API PHP y la configuración SSL de Aiven.'}
          </p>
        </div>
      </footer>
    </>
  )
}
