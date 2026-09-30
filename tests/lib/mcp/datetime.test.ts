import { expect, it } from 'vitest'
import { parseSessionDateTime } from '@/lib/mcp/tools/datetime'

it('treats offset-less input as Seoul wall clock', () => {
  expect(parseSessionDateTime('2026-10-01T19:00')?.toISOString()).toBe(
    '2026-10-01T19:00:00.000Z'
  )
  expect(parseSessionDateTime('2026-10-01T19:00:30')?.toISOString()).toBe(
    '2026-10-01T19:00:30.000Z'
  )
})

it('converts offset input to Seoul wall clock', () => {
  expect(parseSessionDateTime('2026-10-01T10:00:00Z')?.toISOString()).toBe(
    '2026-10-01T19:00:00.000Z'
  )
  expect(parseSessionDateTime('2026-10-01T19:00:00+09:00')?.toISOString()).toBe(
    '2026-10-01T19:00:00.000Z'
  )
})

it('rejects anything else', () => {
  expect(parseSessionDateTime('tomorrow')).toBeNull()
  expect(parseSessionDateTime('2026-10-01')).toBeNull()
  expect(parseSessionDateTime('2026-13-01T19:00')).toBeNull()
  expect(parseSessionDateTime('2026-02-30T19:00')).toBeNull()
})
