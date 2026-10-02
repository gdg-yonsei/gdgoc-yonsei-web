/** 기수 이름과 시작일. */
export type GenerationRef = { name: string; startDate: string }

/** 기수 띠의 한 칸: 이름과 공개 항목 수. */
export type StripGeneration = { name: string; count: number }

/** 항목들을 기수 이름별로 센다. */
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

/** 모든 기수를 최신순으로, 공개 항목 수와 함께(0이면 공개된 것이 없음). */
export function generationStrip(
  generations: readonly GenerationRef[],
  counts: ReadonlyMap<string, number>
): StripGeneration[] {
  return [...generations]
    .sort(newestFirst)
    .map(({ name }) => ({ name, count: counts.get(name) ?? 0 }))
}

/** 기수 목록에서 이전(더 오래된)·다음(더 최근) 기수. */
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
