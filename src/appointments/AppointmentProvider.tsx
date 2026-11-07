import {
  useCallback,
  useEffect,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react'
import { useAuth } from '../auth/useAuth'
import { apiRequest } from '../lib/api'
import {
  AppointmentContext,
  type Appointment,
  type BookingCatalog,
  type BookingSelection,
  type CalendarAvailability,
  type CatalogTechnique,
} from './AppointmentContext'

const selectionParams = (selection: BookingSelection) =>
  new URLSearchParams({ services: JSON.stringify(selection.services) })

export const AppointmentProvider: FC<PropsWithChildren> = ({ children }) => {
  const { ready, user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<CatalogTechnique[]>([])
  const [catalog, setCatalog] = useState<BookingCatalog | null>(null)
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [loadedAdminId, setLoadedAdminId] = useState<number | null>(null)
  const [loadedClientId, setLoadedClientId] = useState<number | null>(null)
  const [servicesError, setServicesError] = useState('')
  const [appointmentsError, setAppointmentsError] = useState('')
  const [clientAppointmentsError, setClientAppointmentsError] = useState('')
  const isLoading = user?.role === 'admin' && loadedAdminId !== user.id
  const isClientAppointmentsLoading =
    user?.role === 'client' && loadedClientId !== user.id
  const error = user?.role === 'admin' ? appointmentsError : servicesError
  const adminId = user?.role === 'admin' ? user.id : null
  const clientId = user?.role === 'client' ? user.id : null

  useEffect(() => {
    let cancelled = false
    apiRequest<BookingCatalog>('/catalog')
      .then((loadedCatalog) => {
        if (!cancelled) {
          setCatalog(loadedCatalog)
          setServices(loadedCatalog.techniques)
          setIsCatalogLoading(false)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setIsCatalogLoading(false)
          setServicesError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar los servicios.',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const refreshClientAppointments = useCallback(async () => {
    if (clientId === null) {
      return
    }
    try {
      const { appointments: loadedAppointments } = await apiRequest<{
        appointments: Appointment[]
      }>('/appointments/mine')
      setClientAppointments(loadedAppointments)
      setClientAppointmentsError('')
      setLoadedClientId(clientId)
    } catch (loadError: unknown) {
      setClientAppointmentsError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar tus citas.',
      )
      setLoadedClientId(clientId)
    }
  }, [clientId])

  useEffect(() => {
    if (!ready || clientId === null) {
      return
    }

    let cancelled = false
    apiRequest<{ appointments: Appointment[] }>('/appointments/mine')
      .then(({ appointments: loadedAppointments }) => {
        if (!cancelled) {
          setClientAppointments(loadedAppointments)
          setClientAppointmentsError('')
          setLoadedClientId(clientId)
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setClientAppointmentsError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar tus citas.',
          )
          setLoadedClientId(clientId)
        }
      })

    const intervalId = window.setInterval(() => {
      void refreshClientAppointments()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [clientId, ready, refreshClientAppointments])

  useEffect(() => {
    if (!ready || adminId === null) {
      return
    }

    let cancelled = false
    apiRequest<{ appointments: Appointment[] }>('/appointments')
      .then(({ appointments: loadedAppointments }) => {
        if (!cancelled) {
          setAppointments(loadedAppointments)
          setLoadedAdminId(adminId)
          setAppointmentsError('')
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setAppointmentsError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar las citas.',
          )
          setLoadedAdminId(adminId)
        }
      })

    return () => {
      cancelled = true
    }
  }, [adminId, ready])

  const loadAvailability = useCallback(async (
    date: string,
    selection: BookingSelection,
  ) => {
    const query = selectionParams(selection)
    query.set('date', date)
    return apiRequest<{
      availableTimes: string[]
      totalSlots: number
    }>(
      `/appointments/availability?${query.toString()}`,
    )
  }, [])

  const loadCalendarAvailability = useCallback(async (
    month: string,
    selection: BookingSelection,
  ) => {
    const query = selectionParams(selection)
    query.set('month', month)
    return apiRequest<CalendarAvailability>(
      `/appointments/calendar?${query.toString()}`,
    )
  }, [])

  const createAppointment = useCallback(async (
    selection: BookingSelection,
    date: string,
    time: string,
  ) => {
    await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify({ services: selection.services, date, time }),
    })
  }, [])

  const confirmAppointment = useCallback(async (appointmentId: string) => {
    await apiRequest(`/appointments/${encodeURIComponent(appointmentId)}/confirm`, {
      method: 'PATCH',
    })
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status: 'confirmed' }
          : appointment,
      ),
    )
  }, [])

  const completeAppointment = useCallback(async (
    appointmentId: string,
    amount: number,
    paymentMethod: 'Efectivo' | 'Transferencia',
  ) => {
    await apiRequest(`/appointments/${encodeURIComponent(appointmentId)}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, paymentMethod }),
    })
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status: 'completed', amountPaid: amount, paymentMethod }
          : appointment,
      ),
    )
  }, [])

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    await apiRequest(`/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
      method: 'PATCH',
    })
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status: 'cancelled', amountPaid: null, paymentMethod: null }
          : appointment,
      ),
    )
  }, [])

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        clientAppointments,
        services,
        catalog,
        isCatalogLoading,
        isLoading,
        isClientAppointmentsLoading,
        error,
        clientAppointmentsError,
        loadAvailability,
        loadCalendarAvailability,
        createAppointment,
        refreshClientAppointments,
        confirmAppointment,
        completeAppointment,
        cancelAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  )
}
