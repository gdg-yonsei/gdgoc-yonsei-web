/**
 * 최근 세션 로그 섹션의 연출: 커밋 레인 그리기와 행 등장.
 *
 * 장면 함수 규칙은 `../scene.ts` 참고.
 */
import { spring, stagger } from 'animejs'
import { whenPresent } from '@/lib/motion/present'
import { SPRINGS } from '@/lib/motion/springs'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

/**
 * `<log>` 장면. 로그가 스크롤되는 동안 커밋 레인이 아래로 그려지고, 파란 HEAD 표시가 레인 끝을
 * 따라간다. 목록이 들어오면 행이 차례로 미끄러져 들어오고 커밋 점이 튀어 오른다. 행은 서버에서
 * 스트리밍되어 들어오므로 장면은 행이 도착할 때까지 기다린다.
 */
const log: Scene = ({ root, scope, belowFold }) => {
  const cleanups: Array<() => void> = []

  scope.add('arm', (rows: HTMLElement) => {
    if (!belowFold(rows)) return

    // 정적 레인 대신 장면 전용 레인을 그린다. 이 요소 하나의 크기만 바꾸면 스타일 재계산이 한 요소에
    // 그친다. 목록의 CSS 변수를 바꾸면 모든 행의 스타일이 다시 계산됐다.
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

    // 목록 전체에 observer 하나: 행이 차례로 미끄러져 들어오고 커밋 점이 튀어 오른다.
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
