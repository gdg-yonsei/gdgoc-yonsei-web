import { spring, stagger } from 'animejs'
import { whenPresent } from '@/lib/motion/present'
import { SPRINGS } from '@/lib/motion/springs'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

/** 로그 행이 서버에서 스트리밍되므로, 장면은 행이 도착할 때까지 기다린다. */
const log: Scene = ({ root, scope, belowFold }) => {
  const cleanups: Array<() => void> = []

  scope.add('arm', (rows: HTMLElement) => {
    if (!belowFold(rows)) return

    // 장면 전용 레인 하나만 움직여, 목록의 모든 행이 스타일을 다시 계산하지 않게 한다.

    const mark = (className: string) => {
      const span = document.createElement('span')
      span.className = className
      span.setAttribute('aria-hidden', 'true')
      return span
    }
    const lane = mark('log-lane')
    const head = mark('log-head')
    rows.append(lane, head)
    rows.dataset.lane = ''
    cleanups.push(() => {
      lane.remove()
      head.remove()
      delete rows.dataset.lane
    })
    // 레인은 목록 양 끝에서 0.75rem 안쪽까지 이어진다.
    const length =
      rows.offsetHeight - parseFloat(getComputedStyle(rows).fontSize) * 1.5

    scrub(
      sceneTimeline({
        defaults: { ease: 'linear', duration: 1000 },
        autoplay: false,
      })
        .add(lane, { scaleY: [0, 1] }, 0)
        .add(head, { y: [0, length] }, 0),
      {
        target: rows,
        enter: '85% top',
        leave: '60% bottom',
        sync: 0.4,
      }
    )

    sceneTimeline({ autoplay: arrival(rows, '88% top') })
      .add(
        rows.querySelectorAll('.log-entry'),
        {
          x: [-28, 0],
          opacity: [0, 1],
          duration: 700,
          ease: 'out(3)',
          delay: stagger(90),
        },
        0
      )
      .add(
        rows.querySelectorAll('.log-node'),
        { scale: [0, 1], ease: spring(SPRINGS.snap), delay: stagger(90) },
        140
      )
      .init()
  })

  const stop = whenPresent(
    root,
    '.log-rows',
    (rows) => void scope.methods.arm?.(rows)
  )
  return () => {
    stop()
    cleanups.forEach((cleanup) => cleanup())
  }
}

export default log
