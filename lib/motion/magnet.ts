/**
 * 버튼이 포인터 쪽으로 살짝 끌려가는 자석 효과 계산.
 *
 * 홈 화면 연출(anime.js 장면, CSS 전환)이 쓰는 순수 계산 함수. DOM 없이 단위 테스트한다.
 */

type Point = { x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }

/**
 * 요소가 포인터 쪽으로 기우는 거리. 중심에서 포인터까지 거리의 일부만큼 움직이되 최댓값이
 * 있고, 포인터가 요소 반 크기의 `reach`배 안에 있을 때만 움직인다.
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
