// 원본 로고(512×321)의 반지름 ≈52.78, 팔 끝 오프셋(113.6, ±80.2)을 SVG·WebGL이 공유한다.
// 같은 기하 값을 써야 히어로 포스터와 WebGL 필드가 정확히 겹친다.

export const BRACKET = {
  armDx: 113.6,
  armDy: 80.2,
  radius: 52.78,
} as const

/** 괄호 하나만 담는 viewBox. 캡슐의 둥근 끝이 상자 가장자리에 닿는다. */
export const BRACKET_VIEWBOX = {
  width: BRACKET.armDx + BRACKET.radius * 2,
  height: BRACKET.armDy * 2 + BRACKET.radius * 2,
} as const

export type CapsuleHue = 'red' | 'blue' | 'green' | 'yellow'

export type Capsule = {
  hue: CapsuleHue
  ax: number
  ay: number
  bx: number
  by: number
  r: number
}

export type BracketSide = 'left' | 'right'

export type Rect = { left: number; top: number; width: number; height: number }

// 뒤 캡슐이 앞 캡슐 위에 그려져야 원본처럼 빨강 위 파랑, 노랑 위 초록이 된다.
export function bracketCapsulesInViewBox(side: BracketSide): Capsule[] {
  const { armDx, armDy, radius: r } = BRACKET
  const middle = r + armDy
  const near = r
  const far = r + armDx

  if (side === 'left') {
    return [
      { hue: 'red', ax: near, ay: middle, bx: far, by: middle - armDy, r },
      { hue: 'blue', ax: near, ay: middle, bx: far, by: middle + armDy, r },
    ]
  }

  return [
    { hue: 'yellow', ax: near, ay: middle + armDy, bx: far, by: middle, r },
    { hue: 'green', ax: near, ay: middle - armDy, bx: far, by: middle, r },
  ]
}

function round(value: number) {
  // `+0`으로 -0을 0으로 바꿔 경로 문자열에 "-0"이 생기지 않게 한다.
  return Number(value.toFixed(2)) + 0
}

/** 두 중심점 사이 스타디움의 SVG 경로(호는 몸통 바깥쪽으로 볼록하다). */
export function capsulePath({ ax, ay, bx, by, r }: Capsule): string {
  const length = Math.hypot(bx - ax, by - ay) || 1
  const nx = (-(by - ay) / length) * r
  const ny = ((bx - ax) / length) * r
  const [x1, y1, x2, y2] = [ax + nx, ay + ny, bx + nx, by + ny].map(round)
  const [x3, y3, x4, y4] = [bx - nx, by - ny, ax - nx, ay - ny].map(round)
  const radius = round(r)

  return `M${x1} ${y1}L${x2} ${y2}A${radius} ${radius} 0 0 0 ${x3} ${y3}L${x4} ${y4}A${radius} ${radius} 0 0 0 ${x1} ${y1}Z`
}

// offset은 스크롤할 때 화면 좌표의 두 괄호를 좌우로 벌리는 거리다.
export function capsulesFromBracketRects(
  left: Rect,
  right: Rect,
  offset = 0
): Capsule[] {
  const place = (rect: Rect, side: BracketSide, shift: number) => {
    const scale = rect.height / BRACKET_VIEWBOX.height

    return bracketCapsulesInViewBox(side).map((capsule) => ({
      hue: capsule.hue,
      ax: rect.left + capsule.ax * scale + shift,
      ay: rect.top + capsule.ay * scale,
      bx: rect.left + capsule.bx * scale + shift,
      by: rect.top + capsule.by * scale,
      r: capsule.r * scale,
    }))
  }

  return [...place(left, 'left', -offset), ...place(right, 'right', offset)]
}

export function scrollProgress(scrollY: number, heroHeight: number): number {
  if (heroHeight <= 0) return 0
  return Math.min(1, Math.max(0, scrollY / heroHeight))
}

export function partingOffset(progress: number, viewportWidth: number): number {
  const t = Math.min(1, Math.max(0, progress))
  return t * t * (3 - 2 * t) * viewportWidth * 0.55
}
