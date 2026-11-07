import { useEffect, useMemo, useState, type FC, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppointments } from '../../appointments/useAppointments'
import type { BookingSelection } from '../../appointments/AppointmentContext'
import { useAuth } from '../../auth/useAuth'

const weekdays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const steps = ['Cotizar', 'Horario', 'Datos']
const serviceExamples: Record<string, { alt: string; image: string }> = {
  ACRILICO: {
    alt: 'Ejemplo de uñas acrílicas azules',
    image: '/service-images/acrilico.jpg',
  },
  SOFTGEL: {
    alt: 'Ejemplo de uñas de soft gel',
    image: '/service-images/retoque-acrilico.jpg',
  },
  GEL_SEMI: {
    alt: 'Ejemplo de gel semipermanente en uña natural',
    image: '/service-images/gelish.jpg',
  },
  RUBBER_GEL: {
    alt: 'Ejemplo de uñas con rubber gel',
    image: '/service-images/manicura-spa.jpg',
  },
}
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

const mexicoToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export const Booking: FC = () => {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const {
    services,
    catalog,
    isCatalogLoading,
    clientAppointments,
    isClientAppointmentsLoading,
    clientAppointmentsError,
    loadAvailability,
    loadCalendarAvailability,
    createAppointment,
    refreshClientAppointments,
    error: servicesError,
  } = useAppointments()
  const [step, setStep] = useState(0)
  const [serviceCode, setServiceCode] = useState('')
  const [selectedLength, setSelectedLength] = useState<number | null>(null)
  const [effectCounts, setEffectCounts] = useState<Record<string, number>>({})
  const [removal, setRemoval] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [today] = useState(mexicoToday)
  const [calendarMonth, setCalendarMonth] = useState(() => today.slice(0, 7))
  const [calendarData, setCalendarData] = useState<{
    key: string
    dates: Record<string, string[]>
    totalSlots: Record<string, number>
  } | null>(null)
  const [calendarError, setCalendarError] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [reservedKey, setReservedKey] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedService = services.find(
    (service) => service.serviceCode === serviceCode,
  )
  const selectedEffects = useMemo(
    () =>
      (catalog?.effectsByPrice ?? []).flatMap((group) =>
        group.options.flatMap((effect) => {
          const count = effectCounts[effect.id] ?? 0
          return count > 0 ? [{ id: effect.id, count }] : []
        }),
      ),
    [catalog, effectCounts],
  )
  const bookingSelection: BookingSelection = useMemo(
    () => ({
      serviceCode,
      length: selectedService?.usesLength ? selectedLength : null,
      effects: selectedEffects,
      removal,
    }),
    [removal, selectedEffects, selectedLength, selectedService, serviceCode],
  )
  const selectionKey = JSON.stringify(bookingSelection)
  const basePrice = selectedService
    ? selectedService.usesLength
      ? selectedService.lengthPrices.find(
          (item) => item.length === selectedLength,
        )?.price ?? 0
      : selectedService.price
    : 0
  const effectsPrice = selectedEffects.reduce((total, selection) => {
    const price = catalog?.effectsByPrice.find((group) =>
      group.options.some((effect) => effect.id === selection.id),
    )?.price ?? 0
    return total + price * selection.count
  }, 0)
  const removalConfig = catalog?.removals[serviceCode]
  const removalPrice = removal ? removalConfig?.price ?? 0 : 0
  const estimatedTotal = basePrice + effectsPrice + removalPrice
  const estimatedDuration =
    (selectedService?.durationMinutes ?? 0) +
    (removal ? removalConfig?.durationMinutes ?? 0 : 0)
  const calendarKey = `${calendarMonth}:${selectionKey}`
  const calendarAvailability =
    calendarData?.key === calendarKey ? calendarData.dates : null
  const calendarSlotCounts =
    calendarData?.key === calendarKey ? calendarData.totalSlots : null
  const calendarLoading =
    step === 1 && Boolean(serviceCode) && !calendarAvailability
  const availabilityKey = `${date}:${selectionKey}`
  const availabilityLoading = Boolean(date) && reservedKey !== availabilityKey
  const currentAvailableTimes =
    reservedKey === availabilityKey ? availableTimes : []
  const monthDate = new Date(`${calendarMonth}-01T12:00:00`)
  const formattedMonthTitle = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(monthDate)
  const monthTitle =
    formattedMonthTitle.charAt(0).toLocaleUpperCase('es-MX') +
    formattedMonthTitle.slice(1)
  const calendarDays = useMemo(() => {
    const [year, month] = calendarMonth.split('-').map(Number)
    const leadingBlanks = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ]
  }, [calendarMonth])
  const minimumCalendarMonth = today.slice(0, 7)

  useEffect(() => {
    if (!date || !serviceCode || !selectedService) {
      return
    }
    let cancelled = false
    loadAvailability(date, bookingSelection)
      .then(({ availableTimes: times }) => {
        if (!cancelled) {
          setAvailableTimes(times)
          setReservedKey(availabilityKey)
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setReservedKey(availabilityKey)
          setAvailableTimes([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible consultar los horarios.',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [availabilityKey, bookingSelection, date, loadAvailability, selectedService, serviceCode])

  useEffect(() => {
    if (step !== 1 || !serviceCode) {
      return
    }
    let cancelled = false
    loadCalendarAvailability(calendarMonth, bookingSelection)
      .then(({ availableTimesByDate, totalSlotsByDate }) => {
        if (!cancelled) {
          setCalendarData({
            key: calendarKey,
            dates: availableTimesByDate,
            totalSlots: totalSlotsByDate,
          })
          setCalendarError('')
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setCalendarData({
            key: calendarKey,
            dates: {},
            totalSlots: {},
          })
          setCalendarError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible consultar la disponibilidad del calendario.',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [bookingSelection, calendarKey, calendarMonth, loadCalendarAvailability, serviceCode, step])

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const resetSchedule = () => {
    setDate('')
    setTime('')
    setError('')
  }

  const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedService || !date || !time) {
      setError('Selecciona un servicio, una fecha y un horario.')
      return
    }

    setIsSubmitting(true)
    try {
      await createAppointment(bookingSelection, date, time)
      await refreshClientAppointments()
      setError('')
      setConfirmed(true)
      setAvailableTimes((times) => times.filter((slot) => slot !== time))
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'No fue posible registrar la cita. Inténtalo de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fff1f1] text-slate-900">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-white px-4 py-3 sm:px-10">
        <div>
          <p className="font-serif text-lg font-semibold text-slate-900">China Nails</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
            Estudio de belleza
          </p>
        </div>
        {currentAvailableTimes.length === 0 && !availabilityLoading && (
          <p className="mt-4 text-sm text-stone-500">
            No quedan horarios disponibles para esta fecha y selección.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Link
            className="rounded-full border border-rose-200 px-3 py-2 text-xs font-medium text-rose-800 transition hover:bg-rose-50"
            to="/"
          >
            Inicio
          </Link>
          <span className="hidden text-sm text-stone-600 sm:inline">
            Hola, {user?.displayName}
          </span>
          <button
            className="rounded-full border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
            onClick={handleSignOut}
            type="button"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-700">
            Tu momento comienza aquí
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#402b35] sm:text-4xl">
            Reserva tu cita
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Cotiza y agenda tu servicio al instante.
          </p>
        </div>

        <ol
          aria-label="Pasos para reservar"
          className="mb-8 flex items-center justify-center gap-2 sm:gap-4"
        >
          {steps.map((label, index) => (
            <li className="flex items-center gap-2 sm:gap-4" key={label}>
              <span
                aria-current={step === index ? 'step' : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 ${
                  step === index
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : step > index
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-200 text-stone-600'
                }`}
              >
                {index + 1}. {label}
              </span>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className="h-0.5 w-4 bg-stone-300 sm:w-8" />
              )}
            </li>
          ))}
        </ol>

        <section className="overflow-hidden rounded-2xl border-t-4 border-rose-500 bg-white p-5 shadow-xl shadow-rose-950/10 sm:p-8">
          {confirmed ? (
            <div className="py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
                ✓
              </span>
              <h2 className="mt-5 font-serif text-3xl text-[#402b35]">
                ¡Tu cita está registrada, {user?.displayName}!
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">
                Tu cita de {selectedService?.name} quedó registrada para el {date}
                {' '}a las {time}. El estudio confirmará los detalles contigo.
              </p>
              <button
                className="mt-7 rounded-full bg-rose-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-950"
                onClick={() => {
                  setConfirmed(false)
                  setStep(0)
                  setServiceCode('')
                  setDate('')
                  setTime('')
                  setCalendarMonth(today.slice(0, 7))
                }}
                type="button"
              >
                Hacer otra cotización
              </button>
            </div>
          ) : (
            <>
              {step === 0 && (
                <>
                  <div className="mb-5">
                    <h2 className="font-serif text-xl font-semibold text-[#402b35]">
                      Selecciona tu servicio
                    </h2>
                    <p className="mt-1 text-sm text-stone-600">Servicio base</p>
                  </div>
                  {servicesError && (
                    <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                      {servicesError}
                    </p>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.map((service) => {
                      const isSelected = service.serviceCode === serviceCode
                      return (
                        <button
                          aria-pressed={isSelected}
                          className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-rose-500/10 ${
                            isSelected
                            ? 'border-violet-400 bg-[#2b193c] ring-1 ring-violet-400 shadow-lg shadow-violet-950/25'
                              : 'border-stone-200 hover:border-rose-300 hover:bg-rose-50/40'
                          }`}
                          key={service.serviceCode}
                          onClick={() => {
                            setServiceCode(service.serviceCode)
                            setSelectedLength(
                              service.usesLength
                                ? service.lengthPrices[0]?.length ?? null
                                : null,
                            )
                            setEffectCounts({})
                            setRemoval(false)
                            setDate('')
                            setTime('')
                          }}
                          type="button"
                        >
                          <span className="flex h-full items-center justify-between gap-3">
                            <span className="min-w-0">
                              <span
                                className={`block text-sm font-semibold ${
                                  isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {service.name}
                              </span>
                              <span className={`mt-1 block text-xs ${isSelected ? 'text-violet-200' : 'text-stone-500'}`}>
                                {service.durationMinutes} min
                              </span>
                              <span className={`mt-2 block font-semibold ${isSelected ? 'text-violet-100' : 'text-rose-600'}`}>
                                {service.usesLength ? 'Desde ' : ''}
                                {money.format(service.price)}
                              </span>
                            </span>
                            {serviceExamples[service.serviceCode] && (
                              <figure className="w-24 shrink-0 sm:w-28">
                                <img
                                  alt={serviceExamples[service.serviceCode].alt}
                                  className="aspect-[4/5] w-full rounded-lg object-cover"
                                  height={140}
                                  loading="lazy"
                                  src={serviceExamples[service.serviceCode].image}
                                  width={112}
                                />
                                <figcaption className="mt-1 text-center text-[10px] leading-tight text-stone-500">
                                  Ejemplo de este servicio
                                </figcaption>
                              </figure>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {services.length === 0 && !servicesError && (
                    <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${isCatalogLoading ? 'bg-stone-100 text-stone-600' : 'bg-amber-50 text-amber-800'}`} role="status">
                      {isCatalogLoading
                        ? 'Cargando catálogo de técnicas…'
                        : 'No hay técnicas disponibles por el momento.'}
                    </p>
                  )}
                  {selectedService && catalog && (
                    <div className="mt-6 space-y-5">
                      {selectedService.usesLength && (
                        <section aria-labelledby="length-label">
                          <h3 className="text-sm font-semibold text-[#402b35]" id="length-label">
                            Elige el largo
                          </h3>
                          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
                            {selectedService.lengthPrices.map((item) => (
                              <button
                                aria-pressed={selectedLength === item.length}
                                className={`rounded-xl border px-2 py-2 text-center transition ${
                                  selectedLength === item.length
                                    ? 'border-violet-500 bg-[#30203f] text-violet-100'
                                    : 'border-rose-100 bg-white text-stone-700 hover:border-rose-400'
                                }`}
                                key={item.length}
                                onClick={() => {
                                  setSelectedLength(item.length)
                                  resetSchedule()
                                }}
                                type="button"
                              >
                                <span className="block text-sm font-semibold">
                                  {item.length}
                                </span>
                                <span className="block text-[10px]">
                                  {money.format(item.price)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}

                      <section aria-labelledby="effects-label">
                        <div>
                          <h3 className="text-sm font-semibold text-[#402b35]" id="effects-label">
                            Efectos y decoración
                          </h3>
                          <p className="mt-1 text-xs text-stone-500">
                            Elige de 0 a 10 uñas por efecto.
                          </p>
                        </div>
                        <div className="mt-3 space-y-4">
                          {catalog.effectsByPrice.map((group) => (
                            <fieldset className="rounded-xl border border-rose-100 p-3" key={group.price}>
                              <legend className="px-1 text-xs font-semibold text-rose-800">
                                {money.format(group.price)} por uña
                              </legend>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {group.options.map((effect) => {
                                  const count = effectCounts[effect.id] ?? 0
                                  return (
                                    <div
                                      className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-[#fffaf9] px-3 py-2"
                                      key={effect.id}
                                    >
                                      <span className="min-w-0 text-sm text-stone-700">
                                        {effect.name}
                                      </span>
                                      <span className="flex shrink-0 items-center gap-2">
                                        <button
                                          aria-label={`Quitar una uña de ${effect.name}`}
                                          className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-lg text-rose-800 disabled:opacity-40"
                                          disabled={count === 0}
                                          onClick={() => {
                                            setEffectCounts((current) => ({
                                              ...current,
                                              [effect.id]: Math.max(0, count - 1),
                                            }))
                                            resetSchedule()
                                          }}
                                          type="button"
                                        >
                                          −
                                        </button>
                                        <span aria-live="polite" className="w-5 text-center text-sm font-semibold text-stone-800">
                                          {count}
                                        </span>
                                        <button
                                          aria-label={`Agregar una uña de ${effect.name}`}
                                          className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-lg text-rose-800 disabled:opacity-40"
                                          disabled={count === 10}
                                          onClick={() => {
                                            setEffectCounts((current) => ({
                                              ...current,
                                              [effect.id]: Math.min(10, count + 1),
                                            }))
                                            resetSchedule()
                                          }}
                                          type="button"
                                        >
                                          +
                                        </button>
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </fieldset>
                          ))}
                        </div>
                      </section>

                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-rose-100 bg-[#fffaf9] p-4">
                        <input
                          checked={removal}
                          className="mt-1 h-4 w-4 accent-violet-700"
                          onChange={(event) => {
                            setRemoval(event.target.checked)
                            resetSchedule()
                          }}
                          type="checkbox"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-stone-800">
                            Retiro de trabajo anterior
                          </span>
                          <span className="mt-1 block text-xs text-stone-500">
                            {money.format(removalConfig?.price ?? 0)} ·{' '}
                            {removalConfig?.durationMinutes
                              ? `+ ${removalConfig.durationMinutes} min`
                              : 'sin tiempo adicional'}
                          </span>
                        </span>
                      </label>
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <div>
                  <h2 className="font-serif text-xl font-semibold text-[#402b35]">
                    Elige fecha y horario
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    Selecciona un día disponible para ver sus horarios.
                  </p>
                  {calendarError && (
                    <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                      {calendarError}
                    </p>
                  )}
                  <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
                    <section
                      aria-label="Calendario de disponibilidad"
                      className="rounded-2xl border border-rose-100 bg-[#fffaf9] p-4 sm:p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <button
                          aria-label="Mes anterior"
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-white text-lg text-rose-900 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={calendarMonth <= minimumCalendarMonth}
                          onClick={() => {
                            const previous = new Date(
                              `${calendarMonth}-01T12:00:00`,
                            )
                            previous.setMonth(previous.getMonth() - 1)
                            setCalendarMonth(toDateKey(previous).slice(0, 7))
                            setDate('')
                            setTime('')
                          }}
                          type="button"
                        >
                          ‹
                        </button>
                        <h3 className="font-serif text-lg font-semibold text-[#402b35]">
                          {monthTitle}
                        </h3>
                        <button
                          aria-label="Mes siguiente"
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-white text-lg text-rose-900 transition hover:bg-rose-50"
                          onClick={() => {
                            const next = new Date(`${calendarMonth}-01T12:00:00`)
                            next.setMonth(next.getMonth() + 1)
                            setCalendarMonth(toDateKey(next).slice(0, 7))
                            setDate('')
                            setTime('')
                          }}
                          type="button"
                        >
                          ›
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-y-2 text-center">
                        {weekdays.map((weekday) => (
                          <span
                            className="pb-2 text-xs font-semibold uppercase text-stone-500"
                            key={weekday}
                          >
                            {weekday}
                          </span>
                        ))}
                        {calendarDays.map((day, index) => {
                          if (day === null) {
                            return (
                              <span
                                aria-hidden="true"
                                className="mx-auto h-10 w-10"
                                key={`blank-${index}`}
                              />
                            )
                          }
                          const dateKey = `${calendarMonth}-${String(day).padStart(2, '0')}`
                          const isPast = dateKey < today
                          const dayTimes = calendarAvailability?.[dateKey] ?? []
                          const isAvailable = dayTimes.length > 0
                          const occupiedSlots =
                            (calendarSlotCounts?.[dateKey] ?? 0) - dayTimes.length
                          const hasLimitedAvailability =
                            isAvailable && occupiedSlots >= 3
                          const isOccupied =
                            calendarAvailability !== null && !isPast && !isAvailable
                          const isSelected = date === dateKey
                          const isDisabled =
                            isPast || calendarLoading || !isAvailable

                          return (
                            <button
                              aria-label={`${day} de ${formattedMonthTitle}${isPast ? ', fecha pasada' : isOccupied ? ', sin horarios disponibles' : hasLimitedAvailability ? ', horarios limitados' : isAvailable ? ', disponible' : ''}`}
                              aria-pressed={isSelected}
                              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-rose-300/50 ${
                                isSelected
                                  ? 'bg-rose-700 text-white shadow-md shadow-rose-900/20'
                                  : isPast || calendarLoading
                                    ? 'cursor-not-allowed bg-stone-100 text-stone-300'
                                    : isOccupied
                                      ? 'cursor-not-allowed bg-stone-100 text-stone-400'
                                      : hasLimitedAvailability
                                        ? 'border border-violet-300 bg-[#30203f] text-violet-200 hover:border-violet-200 hover:bg-[#3b2750]'
                                        : isAvailable
                                          ? 'border border-rose-100 bg-white text-stone-700 hover:border-rose-400 hover:bg-rose-50'
                                          : 'cursor-not-allowed bg-stone-100 text-stone-300'
                              } ${dateKey === today && !isSelected ? 'ring-1 ring-rose-400' : ''}`}
                              disabled={isDisabled}
                              key={dateKey}
                              onClick={() => {
                                setDate(dateKey)
                                setTime('')
                                setError('')
                              }}
                              type="button"
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                      <div
                        aria-label="Leyenda del calendario"
                        className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-rose-100 pt-4 text-xs text-stone-600"
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border border-rose-200 bg-white" />
                          Disponible
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border border-rose-200 bg-rose-50" />
                          Horarios limitados
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full bg-stone-100" />
                          Sin horarios
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full bg-rose-700" />
                          Seleccionado
                        </span>
                      </div>
                      {calendarLoading && (
                        <p className="mt-3 text-xs text-stone-500" role="status">
                          Consultando fechas disponibles…
                        </p>
                      )}
                    </section>

                    <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
                      <h3 className="font-serif text-lg font-semibold text-[#402b35]">
                        Horarios disponibles
                      </h3>
                      <p className="mt-1 text-sm text-stone-500">
                        {date
                          ? new Intl.DateTimeFormat('es-MX', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            }).format(new Date(`${date}T12:00:00`))
                          : 'Primero selecciona una fecha'}
                      </p>
                      {date && availabilityLoading ? (
                        <p className="mt-5 text-sm text-stone-500" role="status">
                          Consultando horarios…
                        </p>
                      ) : date ? (
                        <>
                          <div className="mt-5 grid grid-cols-2 gap-2">
                            {currentAvailableTimes.map((slot) => {
                              const isSelected = time === slot
                              return (
                                <button
                                  aria-pressed={isSelected}
                                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-rose-300/40 ${
                                    isSelected
                                      ? 'border-rose-700 bg-rose-700 text-white shadow-md shadow-rose-900/15'
                                      : 'border-rose-100 bg-[#fffaf9] text-stone-700 hover:border-rose-400 hover:bg-rose-50'
                                  }`}
                                  key={slot}
                                  onClick={() => setTime(slot)}
                                  type="button"
                                >
                                  {slot}
                                  <span className="mt-1 block text-[10px] font-normal no-underline">
                                    {isSelected
                                      ? 'Seleccionado'
                                      : 'Disponible'}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full border border-rose-200 bg-white" />
                              Disponible
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-rose-700" />
                              Seleccionado
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="mt-5 rounded-xl bg-rose-50/70 px-4 py-6 text-center text-sm text-stone-500">
                          Elige una fecha marcada como disponible para consultar sus horarios.
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              )}

              {step === 2 && (
                <form id="booking-details" onSubmit={handleConfirm}>
                  <h2 className="font-serif text-xl font-semibold text-[#402b35]">
                    Tus datos de contacto
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    La cita se registrará con los datos de tu cuenta.
                  </p>
                  <div className="mt-5 grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-stone-500">Nombre</p>
                      <p className="mt-1 text-sm font-medium text-stone-900">
                        {user?.displayName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Teléfono</p>
                      <p className="mt-1 text-sm font-medium text-stone-900">
                        {user?.phone}
                      </p>
                    </div>
                  </div>
                </form>
              )}

              {error && (
                <p className="mt-4 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <p className="text-xs text-stone-500">Total estimado</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {money.format(estimatedTotal)}
                  </p>
                  <p className="text-xs text-stone-500">
                    Base {money.format(basePrice)} · Efectos {money.format(effectsPrice)} · Retiro {money.format(removalPrice)}
                  </p>
                  <p className="text-xs text-stone-500">
                    Tiempo aprox: {estimatedDuration} min
                    {date && time ? ` · ${date} a las ${time}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      className="rounded-full px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-200"
                      onClick={() => {
                        setError('')
                        setStep((current) => current - 1)
                      }}
                      type="button"
                    >
                      Regresar
                    </button>
                  )}
                  {step < 2 ? (
                    <button
                      className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                      disabled={
                        (step === 0 &&
                          (!serviceCode ||
                            services.length === 0 ||
                            (selectedService?.usesLength && selectedLength === null))) ||
                        (step === 1 &&
                          (!date || !time || availabilityLoading || Boolean(error)))
                      }
                      onClick={() => {
                        setError('')
                        setStep((current) => current + 1)
                      }}
                      type="button"
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
                      disabled={isSubmitting}
                      form="booking-details"
                      type="submit"
                    >
                      {isSubmitting ? 'Registrando…' : 'Confirmar cita'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
        <section className="mt-8 overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-5 py-5 sm:px-7">
            <h2 className="font-serif text-2xl text-[#402b35]">Mis citas</h2>
            <p className="mt-1 text-sm text-stone-500">
              Revisa el estado de tus próximas visitas.
            </p>
          </div>
          {clientAppointmentsError && (
            <p className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-7" role="alert">
              {clientAppointmentsError}
            </p>
          )}
          {isClientAppointmentsLoading ? (
            <p className="px-6 py-8 text-center text-sm text-stone-500">
              Cargando tus citas…
            </p>
          ) : clientAppointments.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {clientAppointments.map((appointment) => (
                <article
                  className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
                  key={appointment.id}
                >
                  <div>
                    <h3 className="font-semibold text-stone-900">
                      {appointment.service}
                      {appointment.notes && (
                        <p className="mt-1 text-xs text-stone-500">{appointment.notes}</p>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {appointment.date} · {appointment.time} ·{' '}
                      {appointment.durationMinutes} min
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      appointment.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-800'
                        : appointment.status === 'pending'
                          ? 'bg-amber-50 text-amber-800'
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
                </article>
              ))}
            </div>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-stone-500">
              Aún no tienes citas registradas.
            </p>
          )}
        </section>
        <p className="mt-5 text-center text-xs text-stone-500">
          Precios en MXN. Horario: {catalog?.schedule.openingTime}–{catalog?.schedule.closingTime},{' '}
          {catalog?.schedule.dayNames.join(', ')}; cerrado {catalog?.schedule.closedDays.join(', ')}.
        </p>
      </main>
    </div>
  )
}
