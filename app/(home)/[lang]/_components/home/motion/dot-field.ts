/**
 * 망점(halftone) 물결 효과를 캔버스에 그리는 헬퍼. 참여(join) 장면 배경에 쓴다.
 */
import { createTimer, eases, stagger } from 'animejs'

/** 쉬는 점은 지름 4px에 흐릿하고, 물결의 정점에서는 2.4배 크기에 거의 불투명하다. */
const RADIUS = 2
const REST = { scale: 1, opacity: 0.16 }
const PEAK = { scale: 2.4, opacity: 0.85 }
/**
 * 점은 차례가 오면 250ms 동안 부풀고 750ms 동안 가라앉는다. 차례는 물결이 시작된 칸에서
 * 한 칸 멀어질 때마다 26ms씩 늦게 온다.
 */
const RISE = 250
const FALL = 750
const SPREAD = 26
const ease = eases.out(4)

/** 물결에서 차례가 온 뒤 `ms`가 지났을 때 점이 부푼 정도(쉬면 0, 정점이면 1). */
const swell = (ms: number) =>
  ms <= 0 || ms >= RISE + FALL
    ? 0
    : ms < RISE
      ? ease(ms / RISE)
      : 1 - ease((ms - RISE) / FALL)

type Wave = { start: number; turns: number[]; end: number }

/**
 * `columns` × `rows`개의 망점 필드. `root`의 첫 자식 캔버스 하나에 그린다.
 *
 * 물결은 한 칸에서 시작해 점을 차례로 부풀리고(anime.js 격자 stagger가 각 점의 차례를 정함), 물결이
 * 겹치면 더 크게 부푼 쪽을 따른다. 점을 DOM 요소로 두었을 때는 물결의 매 프레임마다 스타일과 레이어를
 * 다시 계산했고, 점마다 tween을 걸어 물결의 첫 프레임이 길어졌다. 그래서 프레임마다 각 점의 차례로부터
 * 모든 점을 캔버스에 직접 그린다.
 * @param root 캔버스를 넣을 요소
 * @param columns/rows 격자 크기
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

  // 물결이 진행 중일 때만 프레임을 돈다.
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
