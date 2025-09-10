import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSanitize from 'rehype-sanitize'

/**
 * Render MDX content with HTML sanitization to prevent XSS attacks.
 * @param source - MDX content string
 */
export default function SafeMDX({ source }: { source: string | null }) {
  if (!source) {
    return <></>
  }
  return (
    <MDXRemote
      source={source}
      // @ts-expect-error - rehypeSanitize is not typed correctly
      options={{ mdxOptions: { rehypePlugins: [rehypeSanitize] } }}
    />
  )
}
