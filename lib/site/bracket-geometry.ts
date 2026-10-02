/** 로고 원본 좌표에서 잰 괄호 치수. */
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

/** 캡슐 색(GDG 4색). */
export type CapsuleHue = 'red' | 'blue' | 'green' | 'yellow'

/** 캡슐 하나: 양끝 중심점(a, b), 반지름, 색. */
export type Capsule = {
  hue: CapsuleHue
  ax: number
  ay: number
  bx: number
  by: number
  r: number
}

/** 왼쪽 괄호 `<` / 오른쪽 괄호 `>`. */
export type BracketSide = 'left' | 'right'

/** 화면 좌표 사각형. */
export type Rect = { left: number; top: number; width: number; height: number }

/**
 * 괄호 하나의 캡슐들(자체 viewBox 좌표). 뒤에 오는 캡슐이 앞 캡슐 위에 그려져 로고와
 * 같아진다: 빨강 위에 파랑, 노랑 위에 초록.
 */
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

/**
 * 화면에 그려진 두 괄호 상자(예: 캔버스 기준으로 잰 포스터 자리)를 그 좌표계의 캡슐로 바꾼다.
 * `offset`은 스크롤할 때 두 괄호를 좌우로 벌리는 거리다.
 */
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

/** 히어로 높이 대비 스크롤 진행률(0~1). */
export function scrollProgress(scrollY: number, heroHeight: number): number {
  if (heroHeight <= 0) return 0
  return Math.min(1, Math.max(0, scrollY / heroHeight))
}

/** 히어로를 스크롤하는 동안 각 괄호가 벌어지는 거리(smoothstep 이징). */
export function partingOffset(progress: number, viewportWidth: number): number {
  const t = Math.min(1, Math.max(0, progress))
  return t * t * (3 - 2 * t) * viewportWidth * 0.55
}
