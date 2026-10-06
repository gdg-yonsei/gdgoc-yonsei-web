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

const HUES = ['blue', 'red', 'yellow', 'green'] as const

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

/** 단어마다 `< >` 띠를 옮기며, 기술 기둥의 꺾쇠·중괄호 변형은 숨은 윤곽선을 쓴다. */
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
      // 같은 줄에서는 미끄러지듯 움직이고, 처음 나타날 때·다시 측정할 때·줄이 바뀔 때는 바로 옮긴다.
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
        // observer의 onUpdate는 문장 위로 한 번에 건너뛸 때도 호출되어 띠를 끈다.

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

  // 장면이 준비될 때 아직 화면 아래에 있던 블록에만 등장 연출을 준다.
  {
    const lede = root.querySelector<HTMLElement>('.manifesto-lede')
    if (lede && belowFold(lede)) {
      const split = splitText(lede, { lines: { wrap: 'clip' } })
      // anime.js는 split의 줄 목록을 any[]로 둔다. 실제로는 줄마다 감싼 요소다.
      split.addEffect(({ lines }: { lines: HTMLElement[] }) =>
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
          d: svg.morphTo(target),
          duration: 460,
          ease: 'out(3)',
        })
      }
    })
    const open = () => void scope.methods.braces?.(true)
    const close = () => void scope.methods.braces?.(false)
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
