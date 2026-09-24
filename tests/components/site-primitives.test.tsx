import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import Chip from '@/app/components/site/chip'
import EmptyState from '@/app/components/site/empty-state'
import ExternalLink from '@/app/components/site/external-link'
import GenerationPager from '@/app/components/site/generation-pager'
import GenerationStrip from '@/app/components/site/generation-strip'
import PageHeader from '@/app/components/site/page-header'
import PageTransition, {
  PAGE_TRANSITIONS,
} from '@/app/components/site/page-transition'
import SessionPoster from '@/app/components/site/session-poster'

describe('site primitives', () => {
  it('links every crumb but the current page', () => {
    render(
      <Breadcrumbs
        label="Breadcrumb"
        items={[
          { label: 'Home', href: '/en' },
          { label: 'Sessions', href: '/en/session' },
          { label: 'Sixth T19' },
        ]}
      />
    )
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })

    expect(within(trail).getAllByRole('listitem')).toHaveLength(3)
    expect(
      within(trail).getByRole('link', { name: 'Sessions' })
    ).toHaveAttribute('href', '/en/session')
    expect(within(trail).getByText('Sixth T19')).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(within(trail).queryByRole('link', { name: 'Sixth T19' })).toBeNull()
  })

  it('renders one h1 and keeps the code tag decorative', () => {
    render(
      <PageHeader
        tag="<log />"
        title="Session Log"
        description="Every session"
      />
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Session Log' })
    ).toBeInTheDocument()
    expect(screen.getByText('<log />')).toHaveAttribute('aria-hidden', 'true')
  })

  it('links generations with records and mutes empty ones', () => {
    render(
      <GenerationStrip
        basePath="session"
        lang="en"
        label="Generations"
        emptyLabel="no public records yet"
        current="25-26"
        generations={[
          { name: '26-27', count: 0 },
          { name: '25-26', count: 12 },
        ]}
      />
    )
    const strip = screen.getByRole('navigation', { name: 'Generations' })
    const current = within(strip).getByRole('link', { name: /25-26/ })

    expect(current).toHaveAttribute('href', '/en/session/25-26')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current).toHaveAttribute('data-transition-types', 'nav-forward')
    expect(within(strip).queryByRole('link', { name: /26-27/ })).toBeNull()
    expect(within(strip).getByText('26-27')).toHaveTextContent(
      'no public records yet'
    )
  })

  it('offers only the neighbouring generations that exist', () => {
    render(
      <GenerationPager
        basePath="project"
        lang="ko"
        label="기수"
        olderLabel="이전 기수"
        newerLabel="다음 기수"
        older={{ name: '24-25', startDate: '2024-03-01' }}
        newer={null}
      />
    )

    expect(screen.getByRole('link', { name: /이전 기수/ })).toHaveAttribute(
      'href',
      '/ko/project/24-25'
    )
    expect(screen.getByRole('link', { name: /이전 기수/ })).toHaveAttribute(
      'data-transition-types',
      'generation-switch'
    )
    expect(screen.queryByRole('link', { name: /다음 기수/ })).toBeNull()
  })

  it('crossfades when switching generations', () => {
    expect(PAGE_TRANSITIONS['generation-switch']).toBe('crossfade')
    expect(PAGE_TRANSITIONS.default).toBe('none')
  })

  it('keeps the generated poster out of the accessibility tree', () => {
    const { container } = render(
      <SessionPoster
        hue="blue"
        kicker="Tech Talk"
        title="Sixth T19"
        date="Nov 4, 2025"
      />
    )

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstElementChild).toHaveAttribute('data-hue', 'blue')
  })

  it('renders chips, empty states and external links inside a transition', () => {
    render(
      <PageTransition>
        <Chip hue="green">Cloud</Chip>
        <EmptyState title="No sessions yet" body="Check back soon." />
        <ExternalLink href="https://github.com/gdg-yonsei">Source</ExternalLink>
      </PageTransition>
    )

    expect(screen.getByText('Cloud')).toHaveAttribute('data-hue', 'green')
    expect(screen.getByText('No sessions yet')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Source' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')
  })
})
