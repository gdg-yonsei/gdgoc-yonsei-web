import { createAnimatable, spring, stagger, utils } from 'animejs'
import { whenPresent } from '@/lib/motion/present'
import { SPRINGS } from '@/lib/motion/springs'
import { tiltToward } from '@/lib/motion/tilt'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { sceneTimeline } from '../timeline'

/**
 * `<releases>`: the featured cover prints in as growing halftone dots, the
 * cards rise and their stack chips pop. Fine pointers tilt a card toward
 * them with its cover drifting the other way; a press levels the card at
 * once, so the shared cover transition into the project starts flat.
 */
const releases: Scene = ({ root, scope, matches, belowFold }) => {
  const cleanups: Array<() => void> = []

  scope.add('arm', (grid: HTMLElement) => {
    const items = [...grid.querySelectorAll<HTMLElement>('.release-item')]

    if (belowFold(grid)) {
      const timeline = sceneTimeline({
        autoplay: arrival(grid, '85% top'),
        // Hand the cards back to CSS, whose tilt transform an inline
        // identity transform would otherwise override.
        onComplete: (self) => utils.cleanInlineStyles(self),
      })
        .add(
          items,
          {
            y: [56, 0],
            opacity: [0, 1],
            duration: 900,
            ease: 'out(3)',
            delay: stagger(120),
          },
          0
        )
        .add(
          grid.querySelectorAll('.release-tags li'),
          { scale: [0, 1], ease: spring(SPRINGS.snap), delay: stagger(40) },
          420
        )
        .init()

      const cover = grid.querySelector<HTMLElement>(
        '.release-item[data-featured] .release-cover'
      )
      if (cover) {
        cover.dataset.print = ''
        cleanups.push(() => delete cover.dataset.print)
        timeline.add(
          cover,
          {
            '--dot-r': ['0px', '11px'],
            duration: 1400,
            ease: 'inOut(2)',
            onComplete: () => delete cover.dataset.print,
          },
          200
        )
        timeline.init()
      }
    }

    if (!matches.fine) return
    // A card's tilt is made when a pointer first reaches it, keeping its
    // measuring out of the scroll frame that arms the section.
    scope.add('lean', (item: HTMLElement) => {
      const lean = createAnimatable(item, {
        '--tilt-x': { unit: 'deg' },
        '--tilt-y': { unit: 'deg' },
        '--cover-x': { unit: 'px' },
        '--cover-y': { unit: 'px' },
        duration: 500,
        ease: 'out(3)',
      })
      const to = (x: number, y: number, duration?: number) => {
        lean['--tilt-x']?.(x, duration)
        lean['--tilt-y']?.(y, duration)
        lean['--cover-x']?.(-y * 2, duration)
        lean['--cover-y']?.(x * 2, duration)
      }
      const follow = (event: PointerEvent) => {
        const tilt = tiltToward(
          { x: event.clientX, y: event.clientY },
          item.getBoundingClientRect()
        )
        to(tilt.x, tilt.y)
      }
      const level = () => to(0, 0)
      const press = () => to(0, 0, 0)
      item.addEventListener('pointermove', follow)
      item.addEventListener('pointerleave', level)
      item.addEventListener('pointerdown', press)
      cleanups.push(() => {
        item.removeEventListener('pointermove', follow)
        item.removeEventListener('pointerleave', level)
        item.removeEventListener('pointerdown', press)
      })
    })
    for (const item of items) {
      const lean = () => scope.methods.lean?.(item)
      item.addEventListener('pointerenter', lean, { once: true })
      cleanups.push(() => item.removeEventListener('pointerenter', lean))
    }
  })

  const stop = whenPresent(root, '.release-grid', (grid) =>
    scope.methods.arm?.(grid)
  )
  return () => {
    stop()
    cleanups.forEach((cleanup) => cleanup())
  }
}

export default releases
