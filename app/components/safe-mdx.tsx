import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

/**
 * Render user-authored markdown without evaluating MDX/JS expressions.
 * @param source - MDX content string
 */
export default function SafeMDX({ source }: { source: string | null }) {
  if (!source) {
    return <></>
  }
  return (
    <ReactMarkdown
      skipHtml
      // @ts-expect-error - rehypeSanitize is not typed correctly
      rehypePlugins={[rehypeSanitize]}
    >
      {source}
    </ReactMarkdown>
  )
}
