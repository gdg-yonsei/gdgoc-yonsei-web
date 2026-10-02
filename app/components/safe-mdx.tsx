/**
 * 사용자가 작성한 Markdown 본문(세션·프로젝트 설명)을 안전하게 렌더링한다.
 *
 * MDX/JS 표현식은 실행하지 않고, `rehype-sanitize`로 위험한 HTML을 제거한다.
 */
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

/** 제목 태그 목록(수준 순). */
const LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

/** 본문 제목 수준을 `offset`만큼 낮추는 컴포넌트 맵(h6에서 멈춘다). */
function shiftedHeadings(offset: number): Components {
  return Object.fromEntries(
    LEVELS.map((tag, index) => {
      const Shifted = LEVELS[Math.min(index + offset, LEVELS.length - 1)]!
      return [
        tag,
        ({
          node,
          ...props
        }: React.ComponentProps<typeof tag> & {
          node?: unknown
        }) => {
          // react-markdown이 넘기는 hast `node`는 DOM 속성이 아니므로 버린다.
          void node
          return <Shifted {...props} />
        },
      ]
    })
  )
}

/**
 * Markdown 본문을 렌더링한다. 본문이 없으면 아무것도 그리지 않는다.
 * @param source Markdown 원문
 * @param headingOffset 제목 수준을 낮출 단계. 페이지가 이미 h1을 그릴 때 1을 넘긴다
 *   (작성자가 본문을 `# 제목`으로 시작하는 경우가 많아 h1이 두 개가 되는 것을 막는다).
 */
export default function SafeMDX({
  source,
  headingOffset = 0,
}: {
  source: string | null
  headingOffset?: number
}) {
  if (!source) {
    return <></>
  }
  return (
    <ReactMarkdown
      skipHtml
      rehypePlugins={[rehypeSanitize]}
      components={
        headingOffset > 0 ? shiftedHeadings(headingOffset) : undefined
      }
    >
      {source}
    </ReactMarkdown>
  )
}
