import { useEffect, useMemo, useState, type FC } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useAppointments } from '../../appointments/useAppointments'
import { loadFinanceSummary, type FinanceSummary } from '../../finance/api'

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatAppointmentDate = (date: string) =>
  new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`))

export const Dashboard: FC = () => {
  const { user } = useAuth()
  const {
    appointments,
    isLoading,
    error,
    confirmAppointment,
  } = useAppointments()
  const [currentTime] = useState(() => new Date())
  const [today] = useState(() => toDateKey(currentTime))
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmationError, setConfirmationError] = useState('')
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [financeError, setFinanceError] = useState('')
  const currentTimeLabel = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`
  const month = today.slice(0, 7)

  useEffect(() => {
    let cancelled = false
    loadFinanceSummary()
      .then((summary) => {
        if (!cancelled) {
          setFinanceSummary(summary)
          setFinanceError('')
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setFinanceError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar el resumen financiero.',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            (appointment.status === 'pending' ||
              appointment.status === 'confirmed') &&
            (appointment.date > today ||
              (appointment.date === today &&
                appointment.time >= currentTimeLabel)),
        )
        .sort((first, second) =>
          `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`),
        ),
    [appointments, currentTimeLabel, today],
  )

  const appointmentsToday = appointments.filter(
    (appointment) =>
      appointment.date === today && appointment.status !== 'cancelled',
  ).length
  const clientCount = new Set(
    appointments
      .filter((appointment) => appointment.status !== 'cancelled')
      .map((appointment) => appointment.phone),
  ).size
  const metrics = [
    {
      label: 'Citas de hoy',
      value: String(appointmentsToday),
      detail: 'En la agenda del día',
      color: 'bg-rose-100 text-rose-800',
      icon: '01',
    },
    {
      label: 'Próximas citas',
      value: String(upcomingAppointments.length),
      detail: 'Por atender',
      color: 'bg-orange-100 text-orange-800',
      icon: '02',
    },
    {
      label: 'Ganancia neta del mes',
      value: financeSummary === null ? '—' : money.format(financeSummary.net),
      detail: 'Ingresos menos egresos',
      color: 'bg-emerald-100 text-emerald-800',
      icon: '03',
    },
    {
      label: 'Clientas',
      value: String(clientCount),
      detail: 'Con citas registradas',
      color: 'bg-[#30203f] text-violet-100',
      icon: '04',
    },
  ]

  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-800">
            China Nails · Administración
          </p>
          <h1 className="mt-2 font-serif text-4xl text-[#402b35] sm:text-5xl">
            Buenos días, {user?.displayName}.
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Aquí tienes el resumen de actividad y las próximas citas.
          </p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-white/80 px-4 py-3 text-sm font-medium text-stone-700 shadow-sm">
          {new Intl.DateTimeFormat('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(`${today}T12:00:00`))}
        </div>
      </header>

      <section
        aria-label="Resumen de actividad"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <article
            className="rounded-2xl border border-rose-100/80 bg-white p-5 shadow-sm"
            key={metric.label}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-stone-600">{metric.label}</p>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-bold ${metric.color}`}
              >
                {metric.icon}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-[#402b35]">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-stone-500">{metric.detail}</p>
          </article>
        ))}
      </section>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {financeError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          No se pudo cargar el balance financiero: {financeError}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-rose-100/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-stone-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div>
            <h2 className="font-serif text-2xl text-[#402b35]">Próximas citas</h2>
            <p className="mt-1 text-sm text-stone-500">
              Agenda y datos de contacto de tus clientas
            </p>
          </div>
          <span className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
            {upcomingAppointments.length}{' '}
            {upcomingAppointments.length === 1
                ? 'cita próxima'
                : 'citas próximas'}
          </span>
        </div>

          {confirmationError && (
            <p className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-7" role="alert">
              {confirmationError}
            </p>
          )}

        {isLoading ? (
          <p className="px-6 py-12 text-center text-sm text-stone-500">
            Cargando agenda…
          </p>
        ) : upcomingAppointments.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {upcomingAppointments.map((appointment) => (
              <article
                className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7"
                key={appointment.id}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-rose-50 text-rose-900">
                    <span className="text-[10px] font-semibold uppercase">
                      {new Intl.DateTimeFormat('es-MX', {
                        month: 'short',
                      }).format(new Date(`${appointment.date}T12:00:00`))}
                    </span>
                    <span className="text-xl font-bold leading-5">
                      {appointment.date.slice(8, 10)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-stone-900">
                        {appointment.clientName}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                          appointment.status === 'pending'
                            ? 'bg-amber-50 text-amber-800'
                            : appointment.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {appointment.status === 'pending'
                          ? 'Pendiente de confirmación'
                          : appointment.status === 'confirmed'
                            ? 'Confirmada'
                            : appointment.status === 'completed'
                              ? 'Completada'
                              : 'Cancelada'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      {appointment.service}
                    </p>
                    {appointment.notes && (
                      <p className="mt-1 text-xs text-stone-500">
                        {appointment.notes}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-stone-500">
                      {appointment.phone} · {formatAppointmentDate(appointment.date)} ·{' '}
                      {appointment.time} · {appointment.durationMinutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 pl-[4.5rem] sm:pl-0">
                  <p className="text-sm font-semibold text-stone-800">
                    {money.format(appointment.price)}
                  </p>
                  {appointment.status === 'pending' && (
                    <button
                      className="rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-950 disabled:cursor-wait disabled:opacity-60"
                      disabled={confirmingId !== null}
                      onClick={async () => {
                        setConfirmingId(appointment.id)
                        setConfirmationError('')
                        try {
                          await confirmAppointment(appointment.id)
                        } catch (confirmError: unknown) {
                          setConfirmationError(
                            confirmError instanceof Error
                              ? confirmError.message
                              : 'No fue posible confirmar la cita.',
                          )
                        } finally {
                          setConfirmingId(null)
                        }
                      }}
                      type="button"
                    >
                      {confirmingId === appointment.id
                        ? 'Confirmando…'
                        : 'Confirmar cita'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-lg text-rose-800">
              CN
            </span>
            <h3 className="mt-4 font-semibold text-stone-900">
              Aún no hay citas próximas
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
              Las reservas registradas por tus clientas aparecerán aquí junto
              con sus datos, horario y servicio.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-violet-500/25 bg-[#20172b] p-6 shadow-lg shadow-violet-950/15 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-900/70">
            Agenda
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#402b35]">
            Tu día, en orden
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#624b50]">
            {appointmentsToday === 0
              ? 'No tienes citas programadas para hoy.'
              : `Tienes ${appointmentsToday} cita${appointmentsToday === 1 ? '' : 's'} programada${appointmentsToday === 1 ? '' : 's'} para hoy.`}
          </p>
        </article>
        <article className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-800">
            Resumen financiero
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#402b35]">
            Ganancia neta del mes
          </h2>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {financeSummary === null ? '—' : money.format(financeSummary.net)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <p className="text-xs font-medium text-emerald-800">Efectivo en caja</p>
              <p className="mt-1 text-lg font-semibold text-emerald-950">
                {financeSummary === null ? '—' : money.format(financeSummary.netCash)}
              </p>
            </div>
            <div className="rounded-xl bg-sky-50 px-4 py-3">
              <p className="text-xs font-medium text-sky-800">Transferencias</p>
              <p className="mt-1 text-lg font-semibold text-sky-950">
                {financeSummary === null ? '—' : money.format(financeSummary.netTransfer)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-stone-500">
            Ingresos menos egresos registrados en {new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(`${month}-15T12:00:00`))}.
          </p>
        </article>
      </section>
    </div>
  )
}
