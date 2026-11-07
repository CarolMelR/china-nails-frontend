import { useState, type FC, type FormEvent } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { useAppointments } from '../../appointments/useAppointments'
import type { Appointment } from '../../appointments/AppointmentContext'

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

const statusLabels: Record<Appointment['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada / pagada',
  cancelled: 'Cancelada / no asistió',
}

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))

export const Agenda: FC = () => {
  const {
    appointments,
    isLoading,
    error,
    completeAppointment,
    cancelAppointment,
  } = useAppointments()
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [modalAction, setModalAction] = useState<'payment' | 'cancel' | null>(null)
  const [useOriginalTotal, setUseOriginalTotal] = useState(true)
  const [customTotal, setCustomTotal] = useState('')
  const [paymentMethod, setPaymentMethod] =
    useState<'Efectivo' | 'Transferencia'>('Efectivo')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')

  const closeModal = () => {
    setSelectedAppointment(null)
    setModalAction(null)
    setActionError('')
  }

  const openModal = (
    appointment: Appointment,
    action: 'payment' | 'cancel',
  ) => {
    setSelectedAppointment(appointment)
    setModalAction(action)
    setUseOriginalTotal(true)
    setCustomTotal(appointment.price.toFixed(2))
    setPaymentMethod('Efectivo')
    setActionError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAppointment || !modalAction) return

    setIsSubmitting(true)
    setActionError('')
    try {
      if (modalAction === 'payment') {
        const amount = useOriginalTotal
          ? selectedAppointment.price
          : Number(customTotal)
        if (!Number.isFinite(amount) || amount <= 0) {
          setActionError('Ingresa un total cobrado mayor que cero.')
          return
        }
        await completeAppointment(selectedAppointment.id, amount, paymentMethod)
      } else {
        await cancelAppointment(selectedAppointment.id)
      }
      closeModal()
    } catch (submissionError: unknown) {
      setActionError(
        submissionError instanceof Error
          ? submissionError.message
          : 'No fue posible actualizar la cita.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        description="Consulta todas las reservas, registra los cobros finales y conserva las cancelaciones."
        eyebrow="Administración"
        title="Historial de citas"
      />

      {error && (
        <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-5 sm:px-7">
          <h2 className="font-serif text-2xl text-[#402b35]">Todas las citas</h2>
          <p className="mt-1 text-sm text-stone-500">
            Las reservas pendientes no cuentan como ingresos. Registra el cobro al terminar el servicio.
          </p>
        </div>
        {isLoading ? (
          <p className="px-6 py-12 text-center text-sm text-stone-500">
            Cargando historial…
          </p>
        ) : appointments.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-stone-500">
            Aún no hay citas registradas.
          </p>
        ) : (
          <>
            <div className="desktop-data-table overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-[#fff8f6] text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Fecha y hora</th>
                  <th className="px-5 py-4 font-semibold">Clienta</th>
                  <th className="px-5 py-4 font-semibold">Servicio</th>
                  <th className="px-5 py-4 font-semibold">Precio reservado</th>
                  <th className="px-5 py-4 font-semibold">Cobro final</th>
                  <th className="px-5 py-4 font-semibold">Método</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-700">
                      {dateLabel(appointment.date)}
                      <span className="ml-2 text-stone-500">{appointment.time}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-stone-800">{appointment.clientName}</p>
                      <p className="mt-1 text-xs text-stone-500">{appointment.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      <p>{appointment.service}</p>
                      {appointment.notes && (
                        <p className="mt-1 max-w-xs text-xs text-stone-500">
                          {appointment.notes}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                      {money.format(appointment.price)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-stone-800">
                      {appointment.amountPaid === null
                        ? '—'
                        : money.format(appointment.amountPaid)}
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {appointment.paymentMethod ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          appointment.status === 'pending'
                            ? 'bg-amber-50 text-amber-800'
                            : appointment.status === 'confirmed'
                              ? 'bg-sky-50 text-sky-800'
                              : appointment.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {statusLabels[appointment.status]}
                      </span>
                    </td>
                    <td className="min-w-[245px] px-5 py-4">
                      {(appointment.status === 'pending' ||
                        appointment.status === 'confirmed') && (
                        <div className="flex flex-col items-start gap-2">
                          <button
                            className="min-h-10 whitespace-nowrap rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-950 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
                            disabled={!appointment.serviceFinished}
                            onClick={() => openModal(appointment, 'payment')}
                            type="button"
                          >
                            Completar cita
                          </button>
                          {!appointment.serviceFinished && (
                            <span className="pl-2 text-xs leading-5 text-stone-500">
                              Al terminar el servicio
                            </span>
                          )}
                          <button
                            className="min-h-10 whitespace-nowrap rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50"
                            onClick={() => openModal(appointment, 'cancel')}
                            type="button"
                          >
                            Cancelar / no asistió
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="mobile-data-list">
            {appointments.map((appointment) => (
              <article
                className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                key={appointment.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-stone-900">
                      {appointment.clientName}
                    </h3>
                    <p className="mt-1 break-all text-xs text-stone-500">
                      {appointment.phone}
                    </p>
                  </div>
                  <span
                    className={`max-w-full rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      appointment.status === 'pending'
                        ? 'bg-amber-50 text-amber-800'
                        : appointment.status === 'confirmed'
                          ? 'bg-sky-50 text-sky-800'
                          : appointment.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {statusLabels[appointment.status]}
                  </span>
                </div>
                <p className="mt-3 break-words text-sm font-medium text-stone-800">
                  {appointment.service}
                </p>
                {appointment.notes && (
                  <p className="mt-1 break-words text-xs text-stone-500">
                    {appointment.notes}
                  </p>
                )}
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-stone-500">Fecha y hora</dt>
                    <dd className="mt-0.5 text-stone-800">
                      {dateLabel(appointment.date)} · {appointment.time}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Precio reservado</dt>
                    <dd className="mt-0.5 text-stone-800">
                      {money.format(appointment.price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Cobro final</dt>
                    <dd className="mt-0.5 font-semibold text-stone-800">
                      {appointment.amountPaid === null
                        ? '—'
                        : money.format(appointment.amountPaid)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Método de pago</dt>
                    <dd className="mt-0.5 text-stone-800">
                      {appointment.paymentMethod ?? '—'}
                    </dd>
                  </div>
                </dl>
                {(appointment.status === 'pending' ||
                  appointment.status === 'confirmed') && (
                  <div className="mt-4 grid gap-2">
                    <button
                      className="w-full rounded-full bg-rose-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-950 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
                      disabled={!appointment.serviceFinished}
                      onClick={() => openModal(appointment, 'payment')}
                      type="button"
                    >
                      {appointment.serviceFinished
                        ? 'Completar cita'
                        : 'Completar al terminar el servicio'}
                    </button>
                    <button
                      className="w-full rounded-full border border-stone-200 px-3 py-2.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50"
                      onClick={() => openModal(appointment, 'cancel')}
                      type="button"
                    >
                      Cancelar / no asistió
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
          </>
        )}
      </section>

      {selectedAppointment && modalAction && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-stone-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) closeModal()
          }}
        >
          <section
            aria-labelledby="appointment-action-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            role="dialog"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-800">
              {modalAction === 'payment' ? 'Registrar pago' : 'Actualizar cita'}
            </p>
            <h2
              className="mt-2 font-serif text-2xl text-[#402b35]"
              id="appointment-action-title"
            >
              {modalAction === 'payment' ? 'Completar cita' : 'Cancelar / no asistió'}
            </h2>
            {modalAction === 'payment' ? (
              <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
                <div className="rounded-2xl bg-[#fff8f6] p-4">
                  <p className="text-sm text-stone-600">
                    El total original era{' '}
                    <strong className="text-stone-900">
                      {money.format(selectedAppointment.price)}
                    </strong>
                    . ¿Es ese el cobro?
                  </p>
                  <div className="mt-4 space-y-3">
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-stone-700">
                      <input
                        checked={useOriginalTotal}
                        className="mt-0.5 accent-rose-800"
                        name="total-mode"
                        onChange={() => setUseOriginalTotal(true)}
                        type="radio"
                      />
                      Sí, cobrar el total original
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-stone-700">
                      <input
                        checked={!useOriginalTotal}
                        className="mt-0.5 accent-rose-800"
                        name="total-mode"
                        onChange={() => setUseOriginalTotal(false)}
                        type="radio"
                      />
                      No, ingresar el total cobrado
                    </label>
                  </div>
                </div>

                {!useOriginalTotal && (
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-stone-700"
                      htmlFor="final-appointment-total"
                    >
                      Total cobrado (MXN)
                    </label>
                    <input
                      autoFocus
                      className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      id="final-appointment-total"
                      min="0.01"
                      onChange={(event) => setCustomTotal(event.target.value)}
                      required
                      step="0.01"
                      type="number"
                      value={customTotal}
                    />
                  </div>
                )}

                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-stone-700"
                    htmlFor="appointment-payment-method"
                  >
                    Método de pago
                  </label>
                  <select
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                    id="appointment-payment-method"
                    onChange={(event) => {
                      const value = event.target.value
                      if (value === 'Efectivo' || value === 'Transferencia') {
                        setPaymentMethod(value)
                      }
                    }}
                    value={paymentMethod}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                {actionError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                    {actionError}
                  </p>
                )}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    disabled={isSubmitting}
                    onClick={closeModal}
                    type="button"
                  >
                    Volver
                  </button>
                  <button
                    className="rounded-full bg-rose-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-950 disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Guardando…' : 'Confirmar pago'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
                <p className="text-sm leading-6 text-stone-600">
                  La cita se conservará en el historial con el estado cancelada / no asistió y no generará ingresos.
                </p>
                {actionError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                    {actionError}
                  </p>
                )}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    disabled={isSubmitting}
                    onClick={closeModal}
                    type="button"
                  >
                    Volver
                  </button>
                  <button
                    className="rounded-full bg-stone-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Guardando…' : 'Confirmar cancelación'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
