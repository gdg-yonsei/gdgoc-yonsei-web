import { createTimeline, type TimelineParams } from 'animejs'

/**
 * createTimeline for the scenes. No two children of a scene's timeline
 * animate the same property of the same element, so it need not compose
 * them: composing re-renders the timeline around every `.add()`, and each
 * child's read of the page's current values then forces a style
 * recalculation, most of the time a scene takes to arm.
 */
export const sceneTimeline = (parameters: TimelineParams = {}) =>
  createTimeline({ ...parameters, composition: false })
