/**
 * 공개 사이트의 빈 결과 안내.
 */
import type { ReactNode } from 'react'

/**
 * `< />` 마크와 제목·설명·후속 동작으로 이루어진 빈 상태.
 *
 * @param title 제목
 * @param body 보조 설명
 * @param action 후속 동작 링크
 */
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
