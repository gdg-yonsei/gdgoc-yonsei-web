import { createAnimatable, spring, stagger, utils } from 'animejs'
import { whenPresent } from '@/lib/motion/present'
import { SPRINGS } from '@/lib/motion/springs'
import { tiltToward } from '@/lib/motion/tilt'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { sceneTimeline } from '../timeline'

/** 누를 때 카드를 평평하게 되돌려, 공유 표지 전환이 기울어진 상태로 시작되지 않게 한다. */
const releases: Scene = ({ root, scope, matches, belowFold }) => {
  const cleanups: Array<() => void> = []

  scope.add('arm', (grid: HTMLElement) => {
    const items = [...grid.querySelectorAll<HTMLElement>('.release-item')]

    if (belowFold(grid)) {
      const timeline = sceneTimeline({
        autoplay: arrival(grid, '85% top'),
        // 카드를 CSS에 돌려준다. 인라인 identity transform이 남으면 CSS의 기울기 transform을 덮어쓴다.
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
    // 기울기 효과는 첫 포인터 진입 때 만들어, 스크롤 프레임의 장면 준비 중 측정을 피한다.

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
      const lean = () => void scope.methods.lean?.(item)
      item.addEventListener('pointerenter', lean, { once: true })
      cleanups.push(() => item.removeEventListener('pointerenter', lean))
    }
  })

  const stop = whenPresent(
    root,
    '.release-grid',
    (grid) => void scope.methods.arm?.(grid)
  )
  return () => {
    stop()
    cleanups.forEach((cleanup) => cleanup())
  }
}

export default releases
