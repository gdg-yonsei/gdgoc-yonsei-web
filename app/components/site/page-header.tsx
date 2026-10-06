import type { ReactNode } from 'react'

export default function PageHeader({
  tag,
  title,
  description,
  meta,
}: {
  tag?: string
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="page-header">
      {tag && (
        <p aria-hidden="true" className="page-header-tag">
          {tag}
        </p>
      )}
      <h1 className="page-header-title">{title}</h1>
      {description && <p className="page-header-description">{description}</p>}
      {meta && <div className="page-header-meta">{meta}</div>}
    </header>
  )
}
