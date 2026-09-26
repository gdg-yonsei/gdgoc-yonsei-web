import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

const LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

/** Maps markdown heading levels `offset` levels down, stopping at h6. */
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
          void node
          return <Shifted {...props} />
        },
      ]
    })
  )
}

/**
 * Render user-authored markdown without evaluating MDX/JS expressions.
 * @param source - MDX content string
 * @param headingOffset - demotes headings, e.g. 1 when the page already
 *   renders its own h1 (authors often start content with `# Title`)
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
