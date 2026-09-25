import { animate, createAnimatable } from 'animejs'
import { magnetOffset } from '@/lib/motion/magnet'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

/** The curve partingOffset() moves the brackets on, so the words keep pace. */
const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * The stage opens up as it scrolls away: "GDGoC" and "Yonsei" part with the
 * brackets, the copy drifts up and fades, the meta strip dissolves. Fine
 * pointers also get calls to action that lean toward them. The WebGL field
 * (bracket-stage) owns the halftone, taps and parallax; this scene only moves
 * the text, which is already on screen, so it sets no entrance states.
 */
const hero: Scene = ({ root, matches }) => {
  const [first, last] = root.querySelectorAll<HTMLElement>('.hero-word')
  const part = (selector: string) =>
    root.querySelector<HTMLElement>(selector) ?? []

  const opening = sceneTimeline({
    defaults: { ease: 'linear', duration: 1000 },
    autoplay: false,
  })
    .add(
      first ?? [],
      { x: [0, '-19vw'], opacity: [1, 0.15], ease: smoothstep },
      0
    )
    .add(
      last ?? [],
      { x: [0, '19vw'], opacity: [1, 0.15], ease: smoothstep },
      0
    )
    .add(part('.hero-foot'), { opacity: [1, 0], duration: 300 }, 0)
    .add(
      part('.hero-eyebrow'),
      { y: [0, -40], opacity: [1, 0], duration: 500 },
      0
    )
    .add(
      part('.hero-tagline'),
      { y: [0, -56], opacity: [1, 0], duration: 600 },
      60
    )
    .add(
      part('.hero-actions'),
      { y: [0, -72], opacity: [1, 0], duration: 600 },
      120
    )
  scrub(opening, {
    target: root,
    enter: 'start start',
    leave: 'start end',
    sync: 0.25,
  })

  // The scroll cue nods three times, then rests.
  animate(part('.hero-cue'), {
    y: [
      { to: 6, ease: 'out(2)' },
      { to: 0, ease: 'in(2)' },
    ],
    duration: 900,
    loop: 2,
    delay: 400,
  })

  if (!matches.fine) return

  const links = [...root.querySelectorAll<HTMLElement>('.hero-actions > a')]
  const magnets = links.map((link) =>
    createAnimatable(link, {
      '--magnet-x': { unit: 'px' },
      '--magnet-y': { unit: 'px' },
      duration: 450,
      ease: 'out(3)',
    })
  )
  const lean = (to: (link: HTMLElement) => { x: number; y: number }) =>
    links.forEach((link, index) => {
      const { x, y } = to(link)
      magnets[index]?.['--magnet-x']?.(x)
      magnets[index]?.['--magnet-y']?.(y)
    })
  const onMove = (event: PointerEvent) =>
    lean((link) =>
      magnetOffset(
        { x: event.clientX, y: event.clientY },
        link.getBoundingClientRect()
      )
    )
  const onLeave = () => lean(() => ({ x: 0, y: 0 }))

  root.addEventListener('pointermove', onMove)
  root.addEventListener('pointerleave', onLeave)
  return () => {
    root.removeEventListener('pointermove', onMove)
    root.removeEventListener('pointerleave', onLeave)
  }
}

export default hero
