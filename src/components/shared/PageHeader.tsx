import type { FC } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
}

export const PageHeader: FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
}) => (
  <header className="mb-8">
    {eyebrow && (
      <p className="text-sm font-medium text-rose-700">{eyebrow}</p>
    )}
    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
      {title}
    </h1>
    {description && <p className="mt-3 max-w-2xl text-stone-600">{description}</p>}
  </header>
)
