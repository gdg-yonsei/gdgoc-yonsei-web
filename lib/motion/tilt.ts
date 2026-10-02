/**
 * 카드가 포인터 방향으로 기울어지는 효과 계산.
 *
 * 홈 화면 연출(anime.js 장면, CSS 전환)이 쓰는 순수 계산 함수. DOM 없이 단위 테스트한다.
 */

type Point = { x: number; y: number }
type Box = { left: number; top: number; width: number; height: number }

const clampUnit = (value: number) => Math.min(1, Math.max(-1, value))

/**
 * 포인터 아래 부분이 눌려 들어가 보이도록 카드를 기울일 각도(도).
 * `x`는 rotateX, `y`는 rotateY이며 각각 최대 `max`.
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
