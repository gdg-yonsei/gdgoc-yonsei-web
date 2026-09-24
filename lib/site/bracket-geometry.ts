/**
 * Geometry of the GDG `< >` mark, measured from the four capsule paths in
 * app/components/svg/gdg-logo.tsx (viewBox 512×321). Each capsule there is a
 * stadium of radius ≈52.78 whose centre line runs from a bracket apex to an
 * arm tip 113.6 units across and ±80.2 units up or down. The hero poster
 * (SVG) and the WebGL field both derive their shapes from these numbers, so
 * the two renderings line up exactly.
 */
export const BRACKET = {
  armDx: 113.6,
  armDy: 80.2,
  radius: 52.78,
} as const

/** One bracket on its own: the capsule caps touch the view box edges. */
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

/**
 * Capsules of one bracket in its own view box. Later capsules paint over
 * earlier ones, matching the logo: blue over red, green over yellow.
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
  // `+0` folds -0 into 0 so paths never contain "-0".
  return Number(value.toFixed(2)) + 0
}

/** SVG path of a stadium between two centres (arcs bulge away from the body). */
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
 * Maps the two rendered bracket boxes (for example, poster slots measured
 * relative to the canvas) to capsules in that space. `offset` pushes the
 * brackets apart horizontally for the scroll parting.
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

export function scrollProgress(scrollY: number, heroHeight: number): number {
  if (heroHeight <= 0) return 0
  return Math.min(1, Math.max(0, scrollY / heroHeight))
}

/** Smoothstep-eased distance each bracket travels while the hero scrolls. */
export function partingOffset(progress: number, viewportWidth: number): number {
  const t = Math.min(1, Math.max(0, progress))
  return t * t * (3 - 2 * t) * viewportWidth * 0.55
}
