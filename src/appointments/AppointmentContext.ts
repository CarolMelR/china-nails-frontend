import { createContext } from 'react'

export interface Appointment {
  id: string
  clientName: string
  phone: string
  service: string
  date: string
  time: string
  durationMinutes: number
  serviceFinished: boolean
  price: number
  amountPaid: number | null
  paymentMethod: 'Efectivo' | 'Transferencia' | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

export interface Service {
  serviceCode: string
  name: string
  durationMinutes: number
  price: number
}

export interface AppointmentContextValue {
  appointments: Appointment[]
  clientAppointments: Appointment[]
  services: Service[]
  isLoading: boolean
  isClientAppointmentsLoading: boolean
  error: string
  clientAppointmentsError: string
  loadAvailability: (date: string, serviceCode: string) => Promise<string[]>
  loadCalendarAvailability: (
    month: string,
    serviceCode: string,
  ) => Promise<Record<string, string[]>>
  createAppointment: (serviceCode: string, date: string, time: string) => Promise<void>
  refreshClientAppointments: () => Promise<void>
  confirmAppointment: (appointmentId: string) => Promise<void>
  completeAppointment: (
    appointmentId: string,
    amount: number,
    paymentMethod: 'Efectivo' | 'Transferencia',
  ) => Promise<void>
  cancelAppointment: (appointmentId: string) => Promise<void>
}

export const AppointmentContext = createContext<
  AppointmentContextValue | undefined
>(undefined)
