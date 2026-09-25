type Point = { x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }

/**
 * How far an element leans toward a pointer: a share of the distance from
 * its centre, capped, and only while the pointer is within `reach` times
 * the element's half-size.
 */
export function magnetOffset(
  pointer: Point,
  box: Box,
  { strength = 0.25, reach = 1.6, max = 10 } = {}
): Point {
  const dx = pointer.x - (box.left + box.width / 2)
  const dy = pointer.y - (box.top + box.height / 2)
  const radius = (Math.max(box.width, box.height) / 2) * reach
  if (Math.hypot(dx, dy) > radius) return { x: 0, y: 0 }

  const clamp = (value: number) =>
    Math.min(max, Math.max(-max, value * strength)) + 0
  return { x: clamp(dx), y: clamp(dy) }
}
