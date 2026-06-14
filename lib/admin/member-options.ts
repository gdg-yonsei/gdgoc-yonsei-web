export function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}
