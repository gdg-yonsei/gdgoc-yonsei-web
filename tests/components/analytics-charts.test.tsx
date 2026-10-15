import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import HeatmapGrid from '@/app/(admin)/admin/analytics/_components/heatmap-grid'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import RatingBar from '@/app/(admin)/admin/analytics/_components/rating-bar'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'

function withI18n(node: React.ReactNode) {
  return (
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      {node}
    </AdminI18nProvider>
  )
}

describe('ChartFrame', () => {
  it('describes the chart and swaps to a table view', async () => {
    render(
      withI18n(
        <ChartFrame
          title={'Trend'}
          summary={'Sessions rose from 10 to 20'}
          table={{
            columns: ['Date', 'Sessions'],
            rows: [
              ['Oct 13', 10],
              ['Oct 14', 20],
            ],
          }}
        >
          <div data-testid={'chart'} />
        </ChartFrame>
      )
    )
    expect(
      screen.getByRole('figure', { name: 'Trend' })
    ).toHaveAccessibleDescription('Sessions rose from 10 to 20')
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }))
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(screen.queryByTestId('chart')).toBeNull()
  })
})

describe('BarList', () => {
  it('lists values as text with proportional bars', () => {
    render(
      <BarList
        items={[
          { label: 'Organic Search', value: 30 },
          { label: 'Direct', value: 15 },
        ]}
        valueLabel={'Sessions'}
        format={(value) => String(value)}
      />
    )
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Organic Search')
    expect(items[0]).toHaveTextContent('30')
    expect(items[1]!.querySelector('[data-bar]')).toHaveStyle({ width: '50%' })
  })
})

describe('MetricTile', () => {
  it('shows the delta direction with words, not color alone', () => {
    render(
      withI18n(
        <MetricTile
          label={'Bounce rate'}
          value={'40%'}
          delta={0.1}
          goodWhenUp={false}
          spark={[1, 2, 3]}
        />
      )
    )
    expect(screen.getByText('+10.0%')).toHaveAttribute('data-tone', 'bad')
    expect(screen.getByText('vs previous period')).toBeInTheDocument()
  })
})

describe('HeatmapGrid', () => {
  it('labels every cell for screen readers', () => {
    render(
      <HeatmapGrid
        rows={['Mon']}
        columns={['0', '1']}
        values={[[0, 4]]}
        format={(value) => `${value} sessions`}
      />
    )
    expect(
      screen.getByRole('cell', { name: 'Mon 1: 4 sessions' })
    ).toBeInTheDocument()
  })
})

describe('RatingBar', () => {
  it('prints each rating share with its label', () => {
    render(
      <RatingBar
        good={6}
        needsImprovement={3}
        poor={1}
        labels={{
          good: 'Good',
          needsImprovement: 'Needs improvement',
          poor: 'Poor',
        }}
      />
    )
    expect(screen.getByText('Good 60%')).toBeInTheDocument()
    expect(screen.getByText('Poor 10%')).toBeInTheDocument()
  })
})
