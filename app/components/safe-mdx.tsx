/** MDX·JS 표현식을 실행하지 않고 rehype-sanitize로 위험한 HTML을 제거한다. */
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

const LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

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

/** 본문이 h1으로 시작해도 페이지 제목과 겹치지 않도록 headingOffset으로 낮춘다(h6에서 멈춤). */
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
