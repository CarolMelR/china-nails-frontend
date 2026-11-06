import type { FC } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { Dashboard } from '../pages/admin/Dashboard'
import { Agenda } from '../pages/admin/Agenda'
import { Finances } from '../pages/admin/Finances'
import { Login } from '../pages/auth/Login'
import { Register } from '../pages/auth/Register'
import { NotFound } from '../pages/NotFound'
import { Booking } from '../pages/client/Booking'
import { Home } from '../pages/public/Home'

export const AppRouter: FC = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<Home />} />
    </Route>

    <Route path="/login" element={<Login />} />
    <Route path="/registro" element={<Register />} />

    <Route
      path="/admin"
      element={
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="agenda" element={<Agenda />} />
      <Route path="finanzas" element={<Finances />} />
    </Route>

    <Route
      path="/cliente"
      element={
        <ProtectedRoute role="client">
          <Booking />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<NotFound />} />
  </Routes>
)
