export type GenerationRef = { name: string; startDate: string }

export type StripGeneration = { name: string; count: number }

export function countByGeneration(
  items: readonly { generationName: string }[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const { generationName } of items) {
    counts.set(generationName, (counts.get(generationName) ?? 0) + 1)
  }
  return counts
}

const newestFirst = (a: GenerationRef, b: GenerationRef) =>
  b.startDate.localeCompare(a.startDate)

/** Every generation, newest first, with its count (0 = nothing public). */
export function generationStrip(
  generations: readonly GenerationRef[],
  counts: ReadonlyMap<string, number>
): StripGeneration[] {
  return [...generations]
    .sort(newestFirst)
    .map(({ name }) => ({ name, count: counts.get(name) ?? 0 }))
}

export function generationNeighbors(
  generations: readonly GenerationRef[],
  name: string
): { older: GenerationRef | null; newer: GenerationRef | null } {
  const ordered = [...generations].sort(newestFirst)
  const index = ordered.findIndex((generation) => generation.name === name)
  if (index === -1) return { older: null, newer: null }
  return {
    older: ordered[index + 1] ?? null,
    newer: ordered[index - 1] ?? null,
  }
}
