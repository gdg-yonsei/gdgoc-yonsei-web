import { animate, createAnimatable, spring, stagger, svg } from 'animejs'
import { columnCount, gridShape } from '@/lib/motion/grid'
import { SPRINGS } from '@/lib/motion/springs'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { sceneTimeline } from '../timeline'

/** SVG 경로 40개를 매 프레임 다시 그리는 비용을 피하려고 선 그리기 대신 도형을 이동한다. */
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
    // 처음 포인터가 닿을 때 스포트라이트를 만들어, 장면 준비 중 여섯 모듈을 모두 측정하지 않게 한다.

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
      const light = () => void scope.methods.light?.(card)
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
        // 마우스가 떠나면 반복도 멈춘다. 보이지 않는 동안에는 돌지 않는다.
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
    const start = () => void scope.methods.ride?.(true)
    const stop = () => void scope.methods.ride?.(false)
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
