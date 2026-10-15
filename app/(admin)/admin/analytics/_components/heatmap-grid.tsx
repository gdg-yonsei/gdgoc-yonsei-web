/** 요일×시간 같은 2차원 강도. 한 색상의 5단계 순차 색(--chart-seq-1..5)을 쓰고 칸마다 접근 가능한 이름을 둔다. */

function step(value: number, max: number) {
  if (max <= 0 || value <= 0) return 0
  return Math.min(5, Math.ceil((value / max) * 5))
}

export default function HeatmapGrid({
  rows,
  columns,
  values,
  format,
}: {
  rows: string[]
  columns: string[]
  values: number[][]
  format: (value: number) => string
}) {
  const max = Math.max(0, ...values.flat())
  return (
    <div className={'overflow-x-auto'}>
      <table className={'border-separate border-spacing-0.5'}>
        <thead>
          <tr>
            <td />
            {columns.map((column) => (
              <th
                key={column}
                scope={'col'}
                className={
                  'type-caption text-ink-muted px-0.5 font-normal tabular-nums'
                }
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row}>
              <th
                scope={'row'}
                className={
                  'type-caption text-ink-muted pr-2 text-left font-normal'
                }
              >
                {row}
              </th>
              {columns.map((column, columnIndex) => {
                const value = values[rowIndex]?.[columnIndex] ?? 0
                const level = step(value, max)
                return (
                  <td
                    key={column}
                    aria-label={`${row} ${column}: ${format(value)}`}
                    title={`${row} ${column}: ${format(value)}`}
                    className={'size-4 min-w-4 rounded-[3px]'}
                    style={{
                      background:
                        level === 0
                          ? 'var(--surface-sunken)'
                          : `var(--chart-seq-${level})`,
                    }}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
