import Link from 'next/link'

/** 경로 항목. `href`가 없으면 링크 없이 텍스트로 그린다. */
export type BreadcrumbItem = { label: string; href?: string }

/** 마지막 경로 항목은 현재 페이지라 링크로 만들지 않고, 상위 링크는 nav-back 전환을 쓴다. */
export default function Breadcrumbs({
  label,
  items,
}: {
  label: string
  items: readonly BreadcrumbItem[]
}) {
  return (
    <nav aria-label={label} className="site-breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={`${index}:${item.label}`}>
              {item.href && !current ? (
                <Link href={item.href} transitionTypes={['nav-back']}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
