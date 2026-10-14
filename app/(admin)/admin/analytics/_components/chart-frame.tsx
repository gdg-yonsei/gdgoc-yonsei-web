'use client'

/**
 * 모든 차트를 감싸는 카드. 요약 문장을 figure 설명으로 연결하고, 같은 데이터를 표로 바꿔 볼 수 있게 한다.
 * 라이트 테마의 일부 범주 색이 대비 3:1 미만이라 표 보기는 선택이 아니라 필수다.
 */
import { useId, useState, type ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export type ChartTable = {
  columns: string[]
  rows: Array<Array<string | number>>
}

export default function ChartFrame({
  title,
  description,
  summary,
  table,
  actions,
  children,
}: {
  title: string
  description?: string
  summary: string
  table: ChartTable
  actions?: ReactNode
  children: ReactNode
}) {
  const { t } = useAdminI18n()
  const [showTable, setShowTable] = useState(false)
  const titleId = useId()
  const summaryId = useId()

  return (
    <figure
      className={'admin-card flex min-w-0 flex-col gap-3'}
      aria-labelledby={titleId}
      aria-describedby={summaryId}
    >
      <div className={'flex flex-wrap items-start justify-between gap-2'}>
        <div className={'flex min-w-0 flex-col gap-0.5'}>
          <figcaption id={titleId} className={'type-title text-ink'}>
            {title}
          </figcaption>
          {description && (
            <p className={'type-caption text-ink-muted'}>{description}</p>
          )}
        </div>
        <div className={'flex flex-wrap items-center gap-2'}>
          {actions}
          <button
            type={'button'}
            className={'admin-btn-ghost'}
            onClick={() => setShowTable((value) => !value)}
          >
            {showTable ? t('analyticsShowChart') : t('analyticsShowTable')}
          </button>
        </div>
      </div>
      <p id={summaryId} className={'sr-only'}>
        {summary}
      </p>
      {showTable ? (
        <div className={'overflow-x-auto'}>
          <table className={'type-body-sm w-full border-collapse text-left'}>
            <thead>
              <tr className={'border-hairline text-ink-muted border-b'}>
                {table.columns.map((column) => (
                  <th
                    key={column}
                    scope={'col'}
                    className={'px-2 py-2 font-medium'}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={'border-hairline border-b last:border-b-0'}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={'text-ink px-2 py-2 tabular-nums'}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  )
}
