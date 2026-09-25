import {
  animate,
  createAnimatable,
  onScroll,
  splitText,
  spring,
  stagger,
  steps,
  svg,
  utils,
} from 'animejs'
import { bandFrame, wordIndexAt } from '@/lib/motion/cursor'
import { SPRINGS } from '@/lib/motion/springs'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { sceneTimeline } from '../timeline'

/** GDG tints the band cycles through, word by word. */
const HUES = ['blue', 'red', 'yellow', 'green'] as const

/** The statement's words, each measured without its trailing space. */
function measureWords(statement: HTMLElement, words: HTMLElement[]) {
  const origin = statement.getBoundingClientRect()
  const range = document.createRange()
  return words.map((word) => {
    range.selectNodeContents(word.firstChild ?? word)
    const box = range.getBoundingClientRect()
    return {
      left: box.left - origin.left,
      top: box.top - origin.top,
      width: box.width,
      height: box.height,
    }
  })
}

/**
 * `<about>`: a `< >` band travels through the statement behind each word
 * as it lights up, putting the word inside the brackets; the introduction
 * then rises line by line and the pillars assemble their glyphs. Hovering
 * the tech pillar bends its chevrons into braces.
 */
const manifesto: Scene = ({ root, scope, matches, belowFold }) => {
  const cleanups: Array<() => void> = []
  const statement = root.querySelector<HTMLElement>('.manifesto-statement')
  const words = [...root.querySelectorAll<HTMLElement>('.manifesto-word')]

  if (statement && words.length > 0) {
    const band = document.createElement('span')
    band.className = 'manifesto-cursor'
    band.setAttribute('aria-hidden', 'true')
    statement.prepend(band)
    const glide = createAnimatable(band, {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      duration: 420,
      ease: 'out(4)',
    })

    let frames = measureWords(statement, words)
    let lit = -1
    const light = (index: number, instant = false) => {
      if (index === lit && !instant) return
      const previous = frames[lit]
      lit = index
      words.forEach((word, position) =>
        word.toggleAttribute('data-lit', position <= index)
      )
      statement.dataset.cursor = index < 0 ? 'off' : 'on'
      const word = frames[index]
      if (!word) return
      const size = parseFloat(getComputedStyle(statement).fontSize)
      const frame = bandFrame(word, { reach: size * 0.2, height: size * 0.96 })
      band.dataset.hue = HUES[index % HUES.length]
      // Glide along a line; jump when appearing, re-measured or wrapping.
      const jump = instant || !previous || Math.abs(previous.top - word.top) > 1
      const duration = jump ? 0 : undefined
      glide.x?.(frame.x, duration)
      glide.y?.(frame.y, duration)
      glide.width?.(frame.width, duration)
      glide.height?.(frame.height, duration)
    }

    const crossing = { progress: 0 }
    animate(crossing, {
      progress: [0, 1],
      ease: 'linear',
      duration: 1000,
      autoplay: onScroll({
        target: statement,
        enter: '85% top',
        leave: '35% bottom',
        sync: true,
        // The observer's onUpdate, unlike the crossing's own callbacks, also
        // runs when a jump lands above the statement, turning the band off.
        onUpdate: () => light(wordIndexAt(crossing.progress, words.length)),
      }),
    })

    const remeasure = () => {
      frames = measureWords(statement, words)
      if (lit >= 0) light(lit, true)
    }
    const resizes = new ResizeObserver(remeasure)
    resizes.observe(statement)
    void document.fonts?.ready.then(remeasure)

    cleanups.push(() => {
      resizes.disconnect()
      band.remove()
      delete statement.dataset.cursor
      for (const word of words) word.removeAttribute('data-lit')
    })
  }

  // Entrances only for blocks still below the fold when the scene armed.
  {
    const lede = root.querySelector<HTMLElement>('.manifesto-lede')
    if (lede && belowFold(lede)) {
      const split = splitText(lede, { lines: { wrap: 'clip' } })
      split.addEffect(({ lines }) =>
        animate(lines, {
          y: ['100%', '0%'],
          duration: 900,
          ease: 'out(4)',
          delay: stagger(70),
          autoplay: arrival(lede, '88% top'),
        }).init()
      )
      cleanups.push(() => split.revert())
    }

    const aside = root.querySelector<HTMLElement>('.manifesto-aside')
    if (aside && belowFold(aside)) {
      animate(aside, {
        y: [40, 0],
        opacity: [0, 1],
        duration: 900,
        delay: 150,
        ease: 'out(3)',
        autoplay: arrival(aside, '88% top'),
      })
    }

    const pillars = root.querySelector<HTMLElement>('.pillars')
    if (pillars && belowFold(pillars)) {
      const cards = [...pillars.querySelectorAll<HTMLElement>('.pillar')]
      const circles = pillars.querySelectorAll('.pillar-glyph circle')
      const chevrons = svg.createDrawable(
        pillars.querySelectorAll('.glyph-stroke-blue, .glyph-stroke-green')
      )
      const bars = pillars.querySelectorAll<SVGElement>('.glyph-bar')
      utils.set(bars, { transformOrigin: '50% 100%' })

      sceneTimeline({
        autoplay: arrival(pillars, '85% top'),
      })
        .add(
          cards,
          {
            y: [56, 0],
            opacity: [0, 1],
            rotate: { from: stagger([-2, 2]), to: 0 },
            duration: 900,
            ease: 'out(3)',
            delay: stagger(110),
          },
          0
        )
        .add(
          circles,
          { scale: [0, 1], ease: spring(SPRINGS.snap), delay: stagger(80) },
          260
        )
        .add(
          chevrons,
          {
            draw: ['0 0', '0 1'],
            duration: 700,
            ease: 'inOut(3)',
            delay: stagger(120),
          },
          360
        )
        .add(
          '.glyph-caret',
          { opacity: [0, 1, 0, 1], duration: 900, ease: steps(1) },
          720
        )
        .add(
          bars,
          { scaleY: [0.1, 1], ease: spring(SPRINGS.snap), delay: stagger(90) },
          460
        )
        .init()
    }
  }

  // The tech pillar bends its chevrons into braces while hovered.
  const tech = root
    .querySelector('.pillar-glyph .glyph-stroke-blue')
    ?.closest('.pillar')
  if (matches.fine && tech) {
    const strokes = [
      [tech.querySelector('.glyph-stroke-blue'), 'left'],
      [tech.querySelector('.glyph-stroke-green'), 'right'],
    ] as const
    scope.add('braces', (open: boolean) => {
      for (const [stroke, side] of strokes) {
        const target = tech.querySelector(
          `[data-morph="${open ? 'brace' : 'chevron'}-${side}"]`
        )
        if (!stroke || !target) continue
        animate(stroke, {
          d: svg.morphTo(target as SVGPathElement),
          duration: 460,
          ease: 'out(3)',
        })
      }
    })
    const open = () => scope.methods.braces?.(true)
    const close = () => scope.methods.braces?.(false)
    tech.addEventListener('pointerenter', open)
    tech.addEventListener('pointerleave', close)
    cleanups.push(() => {
      tech.removeEventListener('pointerenter', open)
      tech.removeEventListener('pointerleave', close)
    })
  }

  return () => cleanups.forEach((cleanup) => cleanup())
}

export default manifesto
