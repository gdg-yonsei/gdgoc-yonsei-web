/**
 * 장면용 anime.js 타임라인 생성 헬퍼.
 */
import { createTimeline, type TimelineParams } from 'animejs'

/**
 * 장면용 createTimeline. 한 장면의 타임라인 안에서는 같은 요소의 같은 속성을 두 자식이 동시에
 * 움직이지 않으므로 합성(composition)이 필요 없다. 합성을 켜면 `.add()`마다 타임라인을 다시
 * 그리고, 자식마다 페이지의 현재 값을 읽느라 스타일 재계산이 일어나 장면 준비 시간 대부분을
 * 차지했다.
 */
export const sceneTimeline = (parameters: TimelineParams = {}) =>
  createTimeline({ ...parameters, composition: false })
