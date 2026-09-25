type Point = { x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }

/** Columns and rows of a dot field about `spacing` pixels apart, shrunk
    evenly to stay within `cap` dots. */
export function fieldShape(
  width: number,
  height: number,
  spacing: number,
  cap: number
): [columns: number, rows: number] {
  let columns = Math.max(1, Math.round(width / spacing))
  let rows = Math.max(1, Math.round(height / spacing))
  if (columns * rows > cap) {
    const shrink = Math.sqrt(cap / (columns * rows))
    columns = Math.max(1, Math.floor(columns * shrink))
    rows = Math.max(1, Math.floor(rows * shrink))
  }
  return [columns, rows]
}

/** Index, row by row, of the dot under a point on a `columns` × `rows`
    field spread evenly over `box`; points outside clamp to its edges. */
export function nearestCell(
  point: Point,
  box: Box,
  columns: number,
  rows: number
): number {
  const cell = (offset: number, size: number, count: number) =>
    Math.min(count - 1, Math.max(0, Math.floor((offset / size) * count)))
  return (
    cell(point.y - box.top, box.height, rows) * columns +
    cell(point.x - box.left, box.width, columns)
  )
}
