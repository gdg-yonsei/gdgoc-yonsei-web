import { createTimeline, type TimelineParams } from 'animejs'

/** 같은 속성을 동시에 움직이는 자식이 없어 합성을 끈다.
 * 합성을 켜면 `.add()`마다 타임라인·스타일을 재계산한다. */
export const sceneTimeline = (parameters: TimelineParams = {}) =>
  createTimeline({ ...parameters, composition: false })
