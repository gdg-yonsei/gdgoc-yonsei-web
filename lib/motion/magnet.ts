type Point = { x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }

// 포인터가 요소 반 크기의 reach배 안에 있을 때만 중심 거리 일부만큼 움직이며 최댓값을 제한한다.
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
