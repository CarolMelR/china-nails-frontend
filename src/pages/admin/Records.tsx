import type { FC } from 'react'
import { EmptyState } from '../../components/shared/EmptyState'
import { PageHeader } from '../../components/shared/PageHeader'

export const Records: FC = () => (
  <>
    <PageHeader
      description="Administra los expedientes de las clientas del estudio."
      eyebrow="Administración"
      title="Expedientes"
    />
    <EmptyState
      description="Los expedientes se mostrarán aquí cuando se defina el modelo de información de clientes."
      title="Aún no hay expedientes para mostrar"
    />
  </>
)
