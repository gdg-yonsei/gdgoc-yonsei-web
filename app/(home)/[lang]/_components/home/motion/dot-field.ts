import { createTimer, eases, stagger } from 'animejs'

const RADIUS = 2
const REST = { scale: 1, opacity: 0.16 }
const PEAK = { scale: 2.4, opacity: 0.85 }
/** 점은 250ms 동안 부풀고 750ms 동안 가라앉으며, 물결 시작점에서 한 칸마다 26ms 늦어진다. */
const RISE = 250
const FALL = 750
const SPREAD = 26
const ease = eases.out(4)

const swell = (ms: number) =>
  ms <= 0 || ms >= RISE + FALL
    ? 0
    : ms < RISE
      ? ease(ms / RISE)
      : 1 - ease((ms - RISE) / FALL)

type Wave = { start: number; turns: number[]; end: number }

/** 겹친 물결은 더 크게 부푼 값을 따르며, DOM 스타일·레이어 비용을 피하려고 캔버스 하나에 직접 그린다. */
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
  // stagger가 인덱스로 차례를 재므로 점마다 대역 객체를 하나씩 둔다.
  const cells = Array.from({ length: columns * rows }, () => ({}))
  const tints = cells.map(
    (_, index) =>
      colours[(index * 7 + Math.floor(index / columns)) % colours.length]!
  )
  const waves: Wave[] = []

  // 크기는 ResizeObserver에서 받으므로 그리는 동안 레이아웃을 읽지 않는다.
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
    /** 칸 인덱스(없으면 가운데)에서 물결을 보낸다. */
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
