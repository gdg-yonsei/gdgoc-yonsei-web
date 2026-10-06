type Point = { x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }

const clampUnit = (value: number) => Math.min(1, Math.max(-1, value))

// 각도는 도 단위이며 x는 rotateX, y는 rotateY다. 포인터 아래쪽이 눌리는 방향으로 기운다.
export function tiltToward(pointer: Point, box: Box, max = 4): Point {
  const nx = clampUnit(
    (pointer.x - (box.left + box.width / 2)) / (box.width / 2 || 1)
  )
  const ny = clampUnit(
    (pointer.y - (box.top + box.height / 2)) / (box.height / 2 || 1)
  )
  return { x: -ny * max + 0, y: nx * max + 0 }
}
