import type { AnchorHTMLAttributes } from 'react'
import ArrowUpRightIcon from '@heroicons/react/24/outline/ArrowUpRightIcon'

export default function ExternalLink({
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a {...props} target="_blank" rel="noreferrer noopener">
      {children}
      <ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
    </a>
  )
}
