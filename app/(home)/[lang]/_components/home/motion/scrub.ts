import {
  animate,
  onScroll,
  type ScrollObserverParams,
  type Timeline,
} from 'animejs'

/** observer는 대역 객체를 움직여, 창 크기 재측정 때 장면 전체의 스타일을 재계산하지 않게 한다.
 * 범위를 한 번에 건너뛸 때도 동기화되도록 대역 콜백 대신 observer의 onUpdate로 타임라인을 갱신한다. */
export function scrub(timeline: Timeline, params: ScrollObserverParams) {
  // 멈춘 타임라인은 위치를 옮기기 전까지 아무것도 그리지 않으므로 시작 상태를 지금 보여 준다.
  timeline.init()
  const scroll = { progress: 0 }
  return animate(scroll, {
    progress: [0, 1],
    duration: 1000,
    ease: 'linear',
    autoplay: onScroll({
      ...params,
      onUpdate: (observer) => {
        params.onUpdate?.(observer)
        timeline.seek(scroll.progress * timeline.duration)
      },
    }),
  })
}
