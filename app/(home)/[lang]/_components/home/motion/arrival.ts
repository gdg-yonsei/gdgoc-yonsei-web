import { onScroll } from 'animejs'

/** A leave threshold no scroll reaches: the target's bottom 100000px above
    the top of the viewport. */
const OUT_OF_REACH = '-100000 bottom'

/**
 * A one-off ScrollObserver for entrances. It enters the first time `target`
 * reaches the `enter` line, or is found already past it. anime.js only
 * enters while the scroll sits between enter and leave, so with its default
 * leave a jump straight past a block (End key, a fast fling) would keep the
 * block hidden in its "from" state; here the leave is out of reach.
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
      // Its entrance is under way: let go, so that anime.js stops
      // re-measuring it after every resize, which seeks the entrance back to
      // its start and forth again.
      self.revert()
      onEnter?.()
    },
  })
}
