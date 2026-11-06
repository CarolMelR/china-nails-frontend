import { BrowserRouter } from 'react-router-dom'
import { AppointmentProvider } from './appointments/AppointmentProvider'
import { AuthProvider } from './auth/AuthProvider'
import { AppRouter } from './router/AppRouter'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppointmentProvider>
          <AppRouter />
        </AppointmentProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
