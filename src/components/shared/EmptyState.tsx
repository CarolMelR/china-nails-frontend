import type { FC } from 'react'

interface EmptyStateProps {
  title: string
  description: string
}

export const EmptyState: FC<EmptyStateProps> = ({ title, description }) => (
  <section className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
    <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">
      {description}
    </p>
  </section>
)
