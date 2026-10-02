/**
 * 장면의 등장 연출을 한 번만 실행하는 ScrollObserver 헬퍼.
 */
import { onScroll } from 'animejs'

/** 어떤 스크롤로도 닿지 않는 leave 기준선: 대상의 아래쪽이 뷰포트 위쪽보다 100000px 위에 있을 때. */
const OUT_OF_REACH = '-100000 bottom'

/**
 * 등장 연출용 일회성 ScrollObserver. `target`이 `enter` 기준선에 처음 닿거나, 이미 지나 있는 것으로
 * 확인되면 들어온다(enter).
 *
 * anime.js는 스크롤 위치가 enter와 leave 사이에 있을 때만 들어오므로, 기본 leave를 쓰면 블록을 한 번에
 * 건너뛰는 이동(End 키, 빠른 플링) 뒤에 블록이 시작(from) 상태로 숨은 채 남는다. 그래서 leave를 닿을 수
 * 없는 곳에 둔다.
 */
export function arrival(
  target: Element,
  enter = '88% top',
  onEnter?: () => void
) {
  return onScroll({
    target,
    enter,
    leave: OUT_OF_REACH,
    repeat: false,
    onEnter: (self) => {
      // 등장이 시작됐으면 관찰을 놓는다. 그러지 않으면 anime.js가 창 크기가 바뀔 때마다 다시 측정하면서
      // 등장 연출을 처음으로 되감았다가 다시 진행시킨다.
      self.revert()
      onEnter?.()
    },
  })
}
