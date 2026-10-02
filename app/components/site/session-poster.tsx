/**
 * 사진이 없는 세션에 대신 보여 주는 포스터 그래픽(서버 컴포넌트).
 */
import BracketPoster from '@/app/components/site/bracket-poster'
import type { Hue } from '@/lib/site/labels'

/**
 * 기본 이미지만 있는 세션의 대체 그림: 분류 색, 망점 괄호, 제목. 페이지의 h1이
 * 이미 제목을 전달하므로 장식으로 취급한다.
 * @param hue 분류 색
 * @param kicker 제목 위 작은 문구(분류 이름)
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
