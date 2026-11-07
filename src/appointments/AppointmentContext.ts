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
  notes: string | null
  amountPaid: number | null
  paymentMethod: 'Efectivo' | 'Transferencia' | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

export interface CatalogTechnique {
  serviceCode: string
  name: string
  description: string
  durationMinutes: number
  price: number
  usesLength: boolean
  lengthPrices: { length: number; price: number }[]
}

export interface CatalogEffect {
  id: string
  name: string
}

export interface CatalogEffectGroup {
  price: number
  options: CatalogEffect[]
}

export interface BookingCatalog {
  techniques: CatalogTechnique[]
  effectsByPrice: CatalogEffectGroup[]
  removals: Record<string, { price: number; durationMinutes: number }>
  schedule: {
    timezone: string
    days: number[]
    dayNames: string[]
    closedDays: string[]
    openingTime: string
    closingTime: string
    slotMinutes: number
  }
}

export interface BookingServiceSelection {
  serviceCode: string
  length: number | null
  effects: { id: string; count: number }[]
  removal: boolean
}

export interface BookingSelection {
  services: BookingServiceSelection[]
}

export interface AvailabilityResult {
  availableTimes: string[]
  totalSlots: number
}

export interface CalendarAvailability {
  availableTimesByDate: Record<string, string[]>
  totalSlotsByDate: Record<string, number>
}

export interface AppointmentContextValue {
  appointments: Appointment[]
  clientAppointments: Appointment[]
  services: CatalogTechnique[]
  catalog: BookingCatalog | null
  isCatalogLoading: boolean
  isLoading: boolean
  isClientAppointmentsLoading: boolean
  error: string
  clientAppointmentsError: string
  loadAvailability: (
    date: string,
    selection: BookingSelection,
  ) => Promise<AvailabilityResult>
  loadCalendarAvailability: (
    month: string,
    selection: BookingSelection,
  ) => Promise<CalendarAvailability>
  createAppointment: (
    selection: BookingSelection,
    date: string,
    time: string,
  ) => Promise<void>
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
