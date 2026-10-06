import { onScroll } from 'animejs'

/** 어떤 스크롤로도 닿지 않는 leave 기준선: 대상의 아래쪽이 뷰포트 위쪽보다 100000px 위에 있을 때. */
const OUT_OF_REACH = '-100000 bottom'

/** End 키·빠른 플링으로 블록을 건너뛰어도 숨은 시작 상태에 남지 않게 leave를 닿을 수 없는 곳에 둔다. */
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
      // 등장이 시작되면 관찰을 멈춰, 창 크기 변경 때 anime.js가 연출을 되감지 않게 한다.

      self.revert()
      onEnter?.()
    },
  })
}
