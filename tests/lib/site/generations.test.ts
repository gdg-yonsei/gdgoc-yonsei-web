import { describe, expect, it } from 'vitest'
import {
  countByGeneration,
  generationNeighbors,
  generationStrip,
} from '@/lib/site/generations'

const generations = [
  { name: '24-25', startDate: '2024-03-01' },
  { name: '26-27', startDate: '2026-03-01' },
  { name: '25-26', startDate: '2025-03-01' },
]

describe('generation helpers', () => {
  it('counts items per generation', () => {
    expect(
      countByGeneration([
        { generationName: '25-26' },
        { generationName: '25-26' },
        { generationName: '24-25' },
      ])
    ).toEqual(
      new Map([
        ['25-26', 2],
        ['24-25', 1],
      ])
    )
  })

  it('orders the strip newest first and keeps empty generations', () => {
    expect(generationStrip(generations, new Map([['25-26', 3]]))).toEqual([
      { name: '26-27', count: 0 },
      { name: '25-26', count: 3 },
      { name: '24-25', count: 0 },
    ])
  })

  it('finds the older and newer neighbours of a generation', () => {
    expect(generationNeighbors(generations, '25-26')).toEqual({
      older: { name: '24-25', startDate: '2024-03-01' },
      newer: { name: '26-27', startDate: '2026-03-01' },
    })
    expect(generationNeighbors(generations, '24-25').older).toBeNull()
    expect(generationNeighbors(generations, 'nope')).toEqual({
      older: null,
      newer: null,
    })
  })
})
