import { spring, stagger } from 'animejs'
import { whenPresent } from '@/lib/motion/present'
import { SPRINGS } from '@/lib/motion/springs'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

/**
 * `<log>`: the commit lane draws itself down as the log scrolls by, with a
 * blue HEAD marker riding its tip; the rows slide in one after another as
 * the list arrives and their commit nodes pop. The rows stream in from the
 * server, so the scene waits for them.
 */
const log: Scene = ({ root, scope, belowFold }) => {
  const cleanups: Array<() => void> = []

  scope.add('arm', (rows: HTMLElement) => {
    if (!belowFold(rows)) return

    // The scene draws a lane of its own in place of the static one: scaling
    // it restyles one element, where a variable on the list restyled every
    // row.
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
    // The lane runs 0.75rem in from either end of the list.
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

    // One observer for the whole list: its rows slide in one after another
    // and their commit nodes pop.
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

  const stop = whenPresent(root, '.log-rows', (rows) =>
    scope.methods.arm?.(rows)
  )
  return () => {
    stop()
    cleanups.forEach((cleanup) => cleanup())
  }
}

export default log
