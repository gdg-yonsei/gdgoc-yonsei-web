import BracketPoster from '@/app/components/site/bracket-poster'
import type { Hue } from '@/lib/site/labels'

/** 페이지 h1이 제목을 전달하므로 대체 포스터는 장식으로 취급한다. */
export default function SessionPoster({
  hue,
  kicker,
  title,
  date,
}: {
  hue: Hue
  kicker: string
  title: string
  date: string
}) {
  return (
    <div aria-hidden="true" className="session-poster" data-hue={hue}>
      <span className="session-poster-bracket">
        <BracketPoster side="left" />
      </span>
      <span className="session-poster-text">
        <span className="session-poster-kicker">{kicker}</span>
        <span className="session-poster-title">{title}</span>
        <span className="session-poster-date">{date}</span>
      </span>
      <span className="session-poster-bracket">
        <BracketPoster side="right" />
      </span>
    </div>
  )
}
