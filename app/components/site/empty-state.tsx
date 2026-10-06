import type { ReactNode } from 'react'

export default function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <p aria-hidden="true" className="empty-state-mark">
        {'< />'}
      </p>
      <p className="empty-state-title">{title}</p>
      {body && <p className="empty-state-body">{body}</p>}
      {action}
    </div>
  )
}
