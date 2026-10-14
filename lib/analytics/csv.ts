/** 보고서 표를 엑셀에서 바로 여는 CSV로 만든다. BOM으로 한글이 깨지지 않게 하고, 수식으로 시작하는 값은 글자로 만든다. */

// =, +, -, @, 탭, CR로 시작하면 스프레드시트가 수식으로 실행할 수 있다(CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/

function cell(value: string | number | null): string {
  if (value === null) return ''
  if (typeof value === 'number') return String(value)
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return /[",\n\r]/.test(safe) || safe !== value
    ? `"${safe.replaceAll('"', '""')}"`
    : safe
}

export function toCsv(
  columns: string[],
  rows: Array<Record<string, string | number | null>>
): string {
  const lines = [
    columns.join(','),
    ...rows.map((row) =>
      columns.map((column) => cell(row[column] ?? null)).join(',')
    ),
  ]
  return `﻿${lines.join('\r\n')}\r\n`
}
