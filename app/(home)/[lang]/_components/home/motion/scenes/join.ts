import { createDraggable, spring, stagger } from 'animejs'
import { fieldShape, nearestCell } from '@/lib/motion/field'
import { SPRINGS } from '@/lib/motion/springs'
import { CAPSULE_HEX } from '@/lib/site/brand'
import { arrival } from '../arrival'
import { createDotField } from '../dot-field'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

const DOT_COLOURS = Object.values(CAPSULE_HEX)

/** Roughly one dot per 52px, never more than 220 of them. */
const DOT_SPACING = 52
const DOT_CAP = 220

/**
 * `<join>`: the bookend. As the section scrolls in, the brackets fly in from
 * the edges, overshoot and clamp around the title, whose words pop; a GDG
 * halftone field behind the call to action then waves out from the centre,
 * and ripples from wherever the stage is tapped. Fine pointers can pull a
 * bracket about; it springs home when let go.
 */
const join: Scene = ({ root, scope, matches }) => {
  const inner = root.querySelector<HTMLElement>('.join-inner')
  const [left, right] = root.querySelectorAll<HTMLElement>('.join-bracket')
  if (!inner || !left || !right) return

  const closing = sceneTimeline({
    defaults: { duration: 1000, ease: 'out(3)' },
    autoplay: false,
  })
    .add(
      left,
      {
        x: ['-38vw', 0],
        rotate: [-16, 0],
        scale: [0.8, 1],
        opacity: [0.35, 1],
      },
      0
    )
    .add(
      right,
      { x: ['38vw', 0], rotate: [16, 0], scale: [0.8, 1], opacity: [0.35, 1] },
      0
    )
    .add(
      root.querySelectorAll('.join-word'),
      {
        y: ['35%', '0%'],
        scale: [0.9, 1],
        duration: 400,
        ease: 'out(4)',
        delay: stagger(80),
      },
      600
    )
  scrub(closing, {
    target: root,
    enter: 'bottom top',
    leave: 'center center',
    sync: 0.4,
  })

  const [columns, rows] = fieldShape(
    root.offsetWidth,
    root.offsetHeight,
    DOT_SPACING,
    DOT_CAP
  )
  const field = createDotField(root, {
    columns,
    rows,
    colours: DOT_COLOURS,
    className: 'join-field',
  })
  const waveFrom = (point: { x: number; y: number }) =>
    field.wave(nearestCell(point, root.getBoundingClientRect(), columns, rows))

  // Once the brackets have clamped shut, the field waves out from the centre.
  arrival(root, 'center center', () => field.wave('center'))

  // Taps on the stage (not on its links or a bracket) ripple from there.
  const onTap = (event: PointerEvent) => {
    const target = event.target as Element | null
    if (target?.closest('a, button, .bracket-poster')) return
    waveFrom({ x: event.clientX, y: event.clientY })
  }
  root.addEventListener('pointerdown', onTap)

  // A fine pointer can pull a bracket about; it springs home when let go.
  // Each becomes draggable once a pointer first reaches it: measuring the
  // stage for both at arm time made that a long frame mid-scroll.
  const grips: Array<() => void> = []
  if (matches.fine) {
    scope.add('grip', (poster: HTMLElement) => {
      createDraggable(poster, {
        container: inner,
        // A single snap point: wherever it is let go, it springs home.
        x: { snap: [0] },
        y: { snap: [0] },
        releaseEase: spring(SPRINGS.snap),
        onGrab: () => {
          const box = poster.getBoundingClientRect()
          waveFrom({ x: box.left + box.width / 2, y: box.top + box.height / 2 })
        },
      })
    })
    for (const bracket of [left, right]) {
      const poster = bracket.querySelector<HTMLElement>('.bracket-poster')
      if (!poster) continue
      const grip = () => scope.methods.grip?.(poster)
      poster.addEventListener('pointerenter', grip, { once: true })
      grips.push(() => poster.removeEventListener('pointerenter', grip))
    }
  }

  return () => {
    root.removeEventListener('pointerdown', onTap)
    grips.forEach((release) => release())
    field.remove()
  }
}

export default join
