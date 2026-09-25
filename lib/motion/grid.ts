/** Columns and rows of `count` items laid out `columns` wide, in the order
    anime.js reads a stagger grid: [columns, rows]. */
export function gridShape(
  count: number,
  columns: number
): [columns: number, rows: number] {
  const width = Math.max(1, Math.min(columns, count))
  return [width, Math.max(1, Math.ceil(count / width))]
}

/** How many items share the first row, given each item's top offset in
    layout order (sub-pixel differences count as the same row). */
export function columnCount(tops: readonly number[]): number {
  const first = tops[0]
  if (first === undefined) return 1
  return Math.max(1, tops.filter((top) => Math.abs(top - first) < 1).length)
}
