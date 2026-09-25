import {
  animate,
  onScroll,
  type ScrollObserverParams,
  type Timeline,
} from 'animejs'

/**
 * Plays a paused `timeline` with the scroll, tracked by an observer made
 * from `params`. After every resize anime.js re-measures each observer,
 * seeking whatever it drives back to its start and forth again to do so;
 * re-rendering the scenes like that forced a style recalculation per
 * observer, long frames mid-scroll. So the observer drives a stand-in (a
 * plain object) and the timeline follows it from the observer's onUpdate:
 * the stand-in's own callbacks are skipped when a jump lands before the
 * range, which would leave the timeline mid-way.
 */
export function scrub(timeline: Timeline, params: ScrollObserverParams) {
  // Paused timelines render nothing until seeked: show the start now.
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
