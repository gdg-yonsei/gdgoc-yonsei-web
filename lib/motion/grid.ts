/** `count`개를 `columns`개씩 놓았을 때의 [열, 행]. anime.js stagger grid가 읽는 순서다. */
export function gridShape(
  count: number,
  columns: number
): [columns: number, rows: number] {
  const width = Math.max(1, Math.min(columns, count))
  return [width, Math.max(1, Math.ceil(count / width))]
}

/** 배치 순서대로의 top 값으로 첫 줄에 놓인 항목 수를 센다(1px 미만 차이는 같은 줄). */
export function columnCount(tops: readonly number[]): number {
  const first = tops[0]
  if (first === undefined) return 1
  return Math.max(1, tops.filter((top) => Math.abs(top - first) < 1).length)
}
