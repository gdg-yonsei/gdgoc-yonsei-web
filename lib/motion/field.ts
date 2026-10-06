type Point = { x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }

/** 약 `spacing`픽셀 간격 점 배경의 열·행 수. 점이 `cap`개를 넘으면 비율대로 줄인다. */
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

// 점 번호는 행 우선이다. 상자 밖의 좌표는 가장자리로 붙인다.
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
