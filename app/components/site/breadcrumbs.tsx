import Link from 'next/link'

export type BreadcrumbItem = { label: string; href?: string }

/** `<nav><ol>` trail; the last item is the current page and isn't a link. */
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
