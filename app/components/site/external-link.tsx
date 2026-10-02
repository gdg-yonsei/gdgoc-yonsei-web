/**
 * 새 탭으로 여는 외부 링크(화살표 아이콘 포함).
 */
import type { AnchorHTMLAttributes } from 'react'
import ArrowUpRightIcon from '@heroicons/react/24/outline/ArrowUpRightIcon'

/** `target="_blank"`와 `rel="noreferrer noopener"`를 항상 붙인 `<a>`. 나머지 속성은 그대로 넘긴다. */
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
