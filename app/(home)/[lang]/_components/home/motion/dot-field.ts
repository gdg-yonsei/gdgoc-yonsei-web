import { createTimer, eases, stagger } from 'animejs'

/** At rest a dot is 4px across and faint; at a wave's crest it is 2.4 times
    the size and nearly opaque. */
const RADIUS = 2
const REST = { scale: 1, opacity: 0.16 }
const PEAK = { scale: 2.4, opacity: 0.85 }
/** A dot swells for 250ms once its turn comes, then settles over 750ms.
    Turns come 26ms apart per cell of distance from where the wave began. */
const RISE = 250
const FALL = 750
const SPREAD = 26
const ease = eases.out(4)

/** How far a dot has swelled (0 at rest, 1 at the crest) `ms` after its
    turn in a wave came. */
const swell = (ms: number) =>
  ms <= 0 || ms >= RISE + FALL
    ? 0
    : ms < RISE
      ? ease(ms / RISE)
      : 1 - ease((ms - RISE) / FALL)

type Wave = { start: number; turns: number[]; end: number }

/**
 * A halftone field of `columns` × `rows` dots, drawn on one canvas as the
 * first child of `root`. A wave swells the dots one after another out from
 * a cell, with anime.js's grid stagger giving each dot its turn, and waves
 * that overlap keep the larger swell. As elements the dots were restyled
 * and re-layered on every frame of a wave, and tweening each of them made
 * the first frame of a wave a long one; here each frame draws every dot
 * from its turn.
 */
export function createDotField(
  root: HTMLElement,
  {
    columns,
    rows,
    colours,
    className,
  }: {
    columns: number
    rows: number
    colours: readonly string[]
    className: string
  }
) {
  const canvas = document.createElement('canvas')
  canvas.className = className
  canvas.setAttribute('aria-hidden', 'true')
  canvas.dataset.columns = String(columns)
  canvas.dataset.rows = String(rows)
  const context = canvas.getContext('2d')
  // One stand-in per dot for the stagger, which measures turns by index.
  const cells = Array.from({ length: columns * rows }, () => ({}))
  const tints = cells.map(
    (_, index) =>
      colours[(index * 7 + Math.floor(index / columns)) % colours.length]!
  )
  const waves: Wave[] = []

  // The size comes from the resize observer, so drawing never reads layout.
  let width = 0
  let height = 0
  const draw = (now = performance.now()) => {
    for (let index = waves.length - 1; index >= 0; index -= 1) {
      if (now >= waves[index]!.end) waves.splice(index, 1)
    }
    if (!context) return
    context.clearRect(0, 0, width, height)
    const cellWidth = width / columns
    const cellHeight = height / rows
    tints.forEach((tint, index) => {
      let crest = 0
      for (const wave of waves) {
        crest = Math.max(crest, swell(now - wave.start - wave.turns[index]!))
      }
      context.globalAlpha = REST.opacity + (PEAK.opacity - REST.opacity) * crest
      context.fillStyle = tint
      context.beginPath()
      context.arc(
        ((index % columns) + 0.5) * cellWidth,
        (Math.floor(index / columns) + 0.5) * cellHeight,
        RADIUS * (REST.scale + (PEAK.scale - REST.scale) * crest),
        0,
        Math.PI * 2
      )
      context.fill()
    })
  }

  // Ticks only while a wave is out.
  const ticker = createTimer({
    autoplay: false,
    onUpdate: () => {
      draw()
      if (waves.length === 0) ticker.pause()
    },
  })

  const resizes = new ResizeObserver(([entry]) => {
    if (!entry) return
    width = entry.contentRect.width
    height = entry.contentRect.height
    const density = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * density)
    canvas.height = Math.round(height * density)
    context?.setTransform(density, 0, 0, density, 0, 0)
    draw()
  })
  root.prepend(canvas)
  resizes.observe(canvas)

  return {
    /** Sends a wave out from a cell index, or from the centre. */
    wave: (from: number | 'center') => {
      const turnOf = stagger(SPREAD, { grid: [columns, rows], from })
      const turns = cells.map((cell, index) => turnOf(cell, index, cells))
      const start = performance.now()
      waves.push({
        start,
        turns,
        end: start + Math.max(...turns) + RISE + FALL,
      })
      ticker.resume()
    },
    remove: () => {
      ticker.pause()
      resizes.disconnect()
      canvas.remove()
    },
  }
}
