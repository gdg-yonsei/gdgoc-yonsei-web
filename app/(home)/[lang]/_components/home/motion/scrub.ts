/**
 * 스크롤 위치에 맞춰 타임라인을 재생(scrub)하는 헬퍼.
 */
import {
  animate,
  onScroll,
  type ScrollObserverParams,
  type Timeline,
} from 'animejs'

/**
 * 멈춰 둔 `timeline`을 스크롤에 맞춰 재생한다. 스크롤 추적은 `params`로 만든 observer가 맡는다.
 *
 * anime.js는 창 크기가 바뀔 때마다 모든 observer를 다시 측정하면서, observer가 움직이는 대상을 처음으로
 * 되감았다가 다시 진행시킨다. 장면 타임라인을 그렇게 다시 그리면 observer마다 스타일 재계산이 일어나
 * 스크롤 중 긴 프레임이 생겼다. 그래서 observer는 대역(일반 객체)을 움직이고, 타임라인은 observer의
 * onUpdate에서 그 값을 따라간다. 대역 자체의 콜백은 범위 앞으로 한 번에 건너뛸 때 호출되지 않아
 * 타임라인이 중간에 멈춰 버리기 때문이다.
 * @param timeline 멈춘(paused) 장면 타임라인
 * @param params ScrollObserver 설정(enter/leave 기준선 등)
 */
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
