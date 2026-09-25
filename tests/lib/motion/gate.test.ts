import { describe, expect, it } from 'vitest'
import { readMotionEnvironment, shouldLoadMotion } from '@/lib/motion/gate'

function fakeWindow({
  reduce = false,
  saveData,
}: {
  reduce?: boolean
  saveData?: boolean
}) {
  return {
    matchMedia: (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' && reduce,
    }),
    navigator: saveData === undefined ? {} : { connection: { saveData } },
  } as unknown as Window
}

describe('motion gate', () => {
  it('loads motion only for visitors who want it and are not saving data', () => {
    expect(shouldLoadMotion({ reducedMotion: false, saveData: false })).toBe(
      true
    )
    expect(shouldLoadMotion({ reducedMotion: true, saveData: false })).toBe(
      false
    )
    expect(shouldLoadMotion({ reducedMotion: false, saveData: true })).toBe(
      false
    )
  })

  it('reads reduced motion and Save-Data from the window', () => {
    expect(readMotionEnvironment(fakeWindow({ reduce: true }))).toEqual({
      reducedMotion: true,
      saveData: false,
    })
    expect(readMotionEnvironment(fakeWindow({ saveData: true }))).toEqual({
      reducedMotion: false,
      saveData: true,
    })
  })

  it('treats a browser without matchMedia as wanting motion', () => {
    expect(
      readMotionEnvironment({ navigator: {} } as unknown as Window)
    ).toEqual({ reducedMotion: false, saveData: false })
  })
})
