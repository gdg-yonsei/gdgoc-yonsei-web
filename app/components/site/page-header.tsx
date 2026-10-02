/**
 * 공개 사이트 페이지 제목 영역.
 */
import type { ReactNode } from 'react'

/**
 * 페이지 제목, 설명, 메타 정보.
 *
 * @param tag 제목 위의 장식용 코드 꼬리표(스크린리더에서는 숨김)
 * @param meta 제목 아래 부가 정보(개수, 날짜 등)
 */
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
