import { animate, createAnimatable, spring, stagger, svg } from 'animejs'
import { columnCount, gridShape } from '@/lib/motion/grid'
import { SPRINGS } from '@/lib/motion/springs'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { sceneTimeline } from '../timeline'

/**
 * `<parts>`: the modules rise in a ripple from the centre of the grid and
 * the shapes in their glyphs pop into place (line drawing was dropped: 40
 * paths redrawn per frame cost the heaviest scroll frames on the page).
 * Fine pointers get a spotlight in each part's hue, and the UI/UX curve
 * sends a dot along its bézier while hovered or focused.
 */
const parts: Scene = ({ root, scope, matches, belowFold }) => {
  const cleanups: Array<() => void> = []
  const grid = root.querySelector<HTMLElement>('.part-grid')
  const modules = [...root.querySelectorAll<HTMLElement>('.part-module')]

  if (grid && modules.length > 0 && belowFold(grid)) {
    const shape = gridShape(
      modules.length,
      columnCount(modules.map((card) => card.offsetTop))
    )
    sceneTimeline({
      autoplay: arrival(grid, '85% top'),
    })
      .add(
        modules,
        {
          y: [56, 0],
          scale: [0.94, 1],
          opacity: [0, 1],
          duration: 900,
          ease: 'out(3)',
          delay: stagger(90, { grid: shape, from: 'center' }),
        },
        0
      )
      .add(
        grid.querySelectorAll('.pg-accent, .pg-soft'),
        { scale: [0, 1], ease: spring(SPRINGS.snap), delay: stagger(25) },
        320
      )
      .init()
  }

  if (matches.fine) {
    // A module's spotlight is made when a pointer first reaches it (CSS
    // rests it at 50% -40% until then): making all six at arm time measured
    // every module, a long frame mid-scroll.
    scope.add('light', (card: HTMLElement) => {
      const spot = createAnimatable(card, {
        '--spot-x': { unit: 'px' },
        '--spot-y': { unit: 'px' },
        duration: 300,
        ease: 'out(3)',
      })
      const follow = (event: PointerEvent) => {
        const box = card.getBoundingClientRect()
        spot['--spot-x']?.(event.clientX - box.left)
        spot['--spot-y']?.(event.clientY - box.top)
      }
      const rest = (duration?: number) => {
        spot['--spot-x']?.(card.offsetWidth / 2, duration)
        spot['--spot-y']?.(-card.offsetHeight * 0.4, duration)
      }
      const leave = () => rest()
      rest(0)
      card.addEventListener('pointermove', follow)
      card.addEventListener('pointerleave', leave)
      cleanups.push(() => {
        card.removeEventListener('pointermove', follow)
        card.removeEventListener('pointerleave', leave)
      })
    })
    for (const card of modules) {
      const light = () => scope.methods.light?.(card)
      card.addEventListener('pointerenter', light, { once: true })
      cleanups.push(() => card.removeEventListener('pointerenter', light))
    }
  }

  const curve = root.querySelector<SVGPathElement>('.pg-draw')
  const rider = root.querySelector<SVGCircleElement>('.pg-rider')
  const curveModule = curve?.closest<HTMLElement>('.part-module')
  if (curve && rider && curveModule) {
    let ride: ReturnType<typeof animate> | undefined
    scope.add('ride', (on: boolean) => {
      animate(rider, { opacity: on ? 1 : 0, duration: 200 })
      if (!on) {
        // The loop stops with the hover; it never runs unseen.
        ride?.pause()
        return
      }
      ride = animate(rider, {
        ...svg.createMotionPath(curve),
        duration: 1400,
        ease: 'inOut(2)',
        loop: true,
        alternate: true,
      })
    })
    const start = () => scope.methods.ride?.(true)
    const stop = () => scope.methods.ride?.(false)
    curveModule.addEventListener('pointerenter', start)
    curveModule.addEventListener('pointerleave', stop)
    curveModule.addEventListener('focusin', start)
    curveModule.addEventListener('focusout', stop)
    cleanups.push(() => {
      curveModule.removeEventListener('pointerenter', start)
      curveModule.removeEventListener('pointerleave', stop)
      curveModule.removeEventListener('focusin', start)
      curveModule.removeEventListener('focusout', stop)
    })
  }

  return () => cleanups.forEach((cleanup) => cleanup())
}

export default parts
