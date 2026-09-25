type Point = { x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }

const clampUnit = (value: number) => Math.min(1, Math.max(-1, value))

/**
 * Degrees to tilt a card so the part under the pointer presses away:
 * `x` for rotateX, `y` for rotateY, each at most `max`.
 */
export function tiltToward(pointer: Point, box: Box, max = 4): Point {
  const nx = clampUnit(
    (pointer.x - (box.left + box.width / 2)) / (box.width / 2 || 1)
  )
  const ny = clampUnit(
    (pointer.y - (box.top + box.height / 2)) / (box.height / 2 || 1)
  )
  return { x: -ny * max + 0, y: nx * max + 0 }
}
