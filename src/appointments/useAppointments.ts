import { useContext } from 'react'
import { AppointmentContext } from './AppointmentContext'

export const useAppointments = () => {
  const context = useContext(AppointmentContext)

  if (!context) {
    throw new Error(
      'useAppointments debe utilizarse dentro de AppointmentProvider.',
    )
  }

  return context
}
