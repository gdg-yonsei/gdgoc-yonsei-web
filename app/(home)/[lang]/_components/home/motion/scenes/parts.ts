/**
 * 파트 소개 섹션의 연출: 모듈 등장과 포인터 스포트라이트.
 *
 * 장면 함수 규칙은 `../scene.ts` 참고.
 */
import { animate, createAnimatable, spring, stagger, svg } from 'animejs'
import { columnCount, gridShape } from '@/lib/motion/grid'
import { SPRINGS } from '@/lib/motion/springs'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { sceneTimeline } from '../timeline'

/**
 * `<parts>` 장면. 모듈이 격자 가운데에서 물결처럼 떠오르고, 아이콘 속 도형이 제자리로 튀어 들어간다.
 * (선 그리기 연출은 뺐다. 프레임마다 경로 40개를 다시 그리는 비용이 페이지에서 가장 무거운 스크롤
 * 프레임이었다.) 정밀 포인터에서는 각 파트 색의 스포트라이트가 따라오고, UI/UX 곡선은 마우스를 올리거나
 * 포커스하면 점이 베지어 곡선을 따라 움직인다.
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
    // 모듈의 스포트라이트는 포인터가 처음 닿을 때 만든다(그 전까지 CSS가 50% -40%에 둔다). 장면 준비 때
    // 여섯 개를 모두 만들면 모듈마다 측정하느라 스크롤 중 긴 프레임이 생겼다.
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
