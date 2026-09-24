import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterBar from '@/app/components/site/filter-bar'
import type { FilterBarCopy } from '@/lib/site/filter-state'

const copy: FilterBarCopy = {
  label: 'Filters',
  search: 'Search sessions',
  searchPlaceholder: 'Search by title',
  resultOne: '{count} session shown',
  resultMany: '{count} sessions shown',
  noResults: 'No sessions match these filters.',
  reset: 'Reset filters',
}

function renderLog() {
  return render(
    <>
      <FilterBar
        scope="log"
        total={3}
        copy={copy}
        facets={[
          {
            key: 'category',
            legend: 'Type',
            options: [
              { value: 'tech_talk', label: 'Tech Talk', count: 2 },
              { value: 'hackathon', label: 'Hackathon', count: 1 },
            ],
          },
        ]}
      />
      <div id="log">
        <section data-filter-group="">
          <ol>
            <li
              data-filter-item=""
              data-search="sixth t19 cloud"
              data-f-category="tech_talk"
            >
              Sixth T19
            </li>
            <li
              data-filter-item=""
              data-search="seventh t19 ui/ux"
              data-f-category="tech_talk"
            >
              Seventh T19
            </li>
          </ol>
        </section>
        <section data-filter-group="">
          <ol>
            <li
              data-filter-item=""
              data-search="build day"
              data-f-category="hackathon"
            >
              Build Day
            </li>
          </ol>
        </section>
      </div>
    </>
  )
}

describe('FilterBar', () => {
  afterEach(() => window.history.replaceState(null, '', '/en/session'))

  it('shows every row until a filter is chosen', () => {
    renderLog()

    expect(screen.getByText('3 sessions shown')).toBeInTheDocument()
    expect(screen.getByText('Build Day')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Reset filters' })).toBeNull()
  })

  it('filters rows in place, hides emptied groups and mirrors the URL', async () => {
    const user = userEvent.setup()
    renderLog()

    await user.click(screen.getByText('Hackathon'))

    expect(screen.getByRole('checkbox', { name: /Hackathon/ })).toBeChecked()
    expect(screen.getByText('Build Day')).toBeVisible()
    expect(screen.getByText('Sixth T19')).not.toBeVisible()
    expect(screen.getByText('Sixth T19').closest('section')).toHaveAttribute(
      'hidden'
    )
    expect(screen.getByText('1 session shown')).toBeInTheDocument()
    expect(window.location.search).toBe('?category=hackathon')
  })

  it('says when nothing matches and resets everything', async () => {
    const user = userEvent.setup()
    renderLog()

    await user.type(
      screen.getByRole('searchbox', { name: 'Search sessions' }),
      'nothing here'
    )
    expect(
      screen.getByText('No sessions match these filters.')
    ).toBeInTheDocument()
    expect(window.location.search).toBe('?q=nothing+here')

    await user.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(window.location.search).toBe('')
    expect(screen.getByText('3 sessions shown')).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: 'Search sessions' })
    ).toHaveValue('')
  })

  it('adopts a shared link and ignores keys it does not know', () => {
    window.history.replaceState(
      null,
      '',
      '/en/session?category=hackathon&foo=bar'
    )
    renderLog()

    expect(screen.getByRole('checkbox', { name: /Hackathon/ })).toBeChecked()
    expect(screen.getByText('Sixth T19')).not.toBeVisible()
    expect(screen.getByText('1 session shown')).toBeInTheDocument()
  })
})
