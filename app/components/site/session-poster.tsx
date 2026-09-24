import BracketPoster from '@/app/components/site/bracket-poster'
import type { Hue } from '@/lib/site/labels'

/**
 * Stand-in artwork for sessions that only have the stock image: the
 * category colour, the halftone brackets and the title. Decorative — the
 * page's h1 already carries the title.
 */
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
