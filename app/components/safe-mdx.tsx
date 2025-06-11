import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSanitize from 'rehype-sanitize'

/**
 * Render MDX content with HTML sanitization to prevent XSS attacks.
 * @param source - MDX content string
 */
export default function SafeMDX({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      options={{ mdxOptions: { rehypePlugins: [rehypeSanitize] } }}
    />
  )
}

