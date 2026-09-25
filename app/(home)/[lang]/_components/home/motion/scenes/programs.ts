import { animate, stagger, utils, type Timeline } from 'animejs'
import { formatCount, parseCount } from '@/lib/motion/count'
import { stackPhases } from '@/lib/motion/stack'
import { CAPSULE_HEX } from '@/lib/site/brand'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

const BURST_COLOURS = Object.values(CAPSULE_HEX)

/**
 * The Solution Challenge funnel, played once: the bands open from the centre
 * one after another like brackets parting, the figures count up and the
 * Top 10 band bursts into halftone dots. Figures count on an aria-hidden
 * overlay, so the number in the document never changes; the overlay and
 * dots leave when it finishes.
 */
function funnelTimeline(funnel: HTMLElement): {
  timeline: Timeline
  settle: () => void
} {
  const bands = [...funnel.querySelectorAll<HTMLElement>('.sc-funnel-step')]
  const counters = [
    ...funnel.querySelectorAll<HTMLElement>('.sc-funnel-value'),
  ].map((value) => {
    const overlay = document.createElement('span')
    overlay.className = 'sc-funnel-count'
    overlay.setAttribute('aria-hidden', 'true')
    overlay.textContent = '0'
    value.append(overlay)
    value.dataset.counting = ''
    return {
      value,
      overlay,
      target: parseCount(value.firstChild?.textContent ?? '') ?? 0,
      shown: { n: 0 },
    }
  })
  const dots = Array.from({ length: 14 }, (_, index) => {
    const dot = document.createElement('span')
    dot.className = 'sc-funnel-burst'
    dot.setAttribute('aria-hidden', 'true')
    dot.style.backgroundColor = BURST_COLOURS[index % BURST_COLOURS.length]!
    return dot
  })

  const settle = () => {
    for (const { value, overlay } of counters) {
      overlay.remove()
      delete value.dataset.counting
    }
    for (const dot of dots) dot.remove()
  }

  const timeline = sceneTimeline({ autoplay: false, onComplete: settle })
    .add(
      bands,
      { '--open': [0, 1], duration: 620, ease: 'out(3)', delay: stagger(130) },
      0
    )
    .call(() => {
      const last = bands.at(-1)
      if (!last) return
      // Centred on the last band, outside its clip-path.
      const origin = funnel.getBoundingClientRect()
      const box = last.getBoundingClientRect()
      for (const dot of dots) {
        dot.style.left = `${box.left - origin.left + box.width / 2}px`
        dot.style.top = `${box.top - origin.top + box.height / 2}px`
        funnel.append(dot)
      }
    }, 640)
    .add(
      dots,
      {
        x: () => utils.random(-150, 150),
        y: () => utils.random(-70, 70),
        scale: [
          { from: 0, to: 1.4, duration: 260 },
          { to: 0, duration: 520 },
        ],
        ease: 'out(3)',
        delay: stagger(18),
      },
      660
    )

  counters.forEach(({ overlay, target, shown }, index) => {
    timeline.add(
      shown,
      {
        n: [0, target],
        duration: 900,
        ease: 'out(3)',
        onUpdate: () => {
          overlay.textContent = formatCount(shown.n)
        },
      },
      120 + index * 130
    )
  })

  return { timeline, settle }
}

/**
 * `<programs>`: on the sticky stack each card lands like a sticker (its tilt
 * settles and its numeral flips in) and recedes under the next one; the
 * Solution Challenge funnel plays once as its card takes its slot. On phones
 * and short screens the cards simply rise in.
 */
const programs: Scene = ({ root, scope, matches, belowFold }) => {
  const cleanups: Array<() => void> = []
  const cards = [...root.querySelectorAll<HTMLElement>('.program-card')]
  const sheets = cards.map((card) =>
    card.querySelector<HTMLElement>('.program-inner')
  )
  const stack = matches.stack
    ? root.querySelector<HTMLElement>('.program-stack')
    : null
  // Scroll lines are measured on the stack, never on a sticky card: to
  // measure a sticky target anime.js unsticks it, a full layout on every
  // refresh. The rows share one height, so a card's place in the stack's
  // flow is exact.
  const row =
    stack && cards[0]
      ? cards[0].getBoundingClientRect().height +
        (parseFloat(getComputedStyle(stack).rowGap) || 0)
      : 0
  const inFlow = (index: number) => `top+=${Math.round(index * row)}`

  if (stack && cards.length > 0) {
    const slots = cards.map((card) => parseFloat(getComputedStyle(card).top))
    const phases = stackPhases({
      slots,
      height: cards[0]!.offsetHeight,
      viewport: innerHeight,
    })

    // Each sheet dims under a shade of its own as the next card covers it
    // (animating a variable on the sheet restyled all of its contents).
    const shades = sheets.map((sheet) => {
      if (!sheet) return null
      const shade = document.createElement('span')
      shade.className = 'program-shade'
      shade.setAttribute('aria-hidden', 'true')
      sheet.append(shade)
      return shade
    })
    cleanups.push(() => shades.forEach((shade) => shade?.remove()))

    // One scroll-synced timeline per card: it lands (its tilt settles, its
    // numeral flips in) and, over the later part of the same approach, the
    // card it covers recedes. Six observers instead of eleven. All six are
    // built, reading the page, before any renders its start: one style
    // recalculation rather than one per card.
    const scrubs: Array<() => void> = []
    phases.forEach(({ landing }, index) => {
      const sheet = sheets[index]
      if (!sheet) return
      const timeline = sceneTimeline({
        defaults: { ease: 'out(2)', duration: 1000 },
        autoplay: false,
      })
        .add(sheet, { rotate: [index % 2 ? 2.5 : -2.5, 0] }, 0)
        .add(
          sheet.querySelector('.program-index') ?? [],
          { y: ['45%', '0%'], rotate: [-12, 0], duration: 700 },
          300
        )

      const beneath = sheets[index - 1]
      const shade = shades[index - 1]
      const covering = phases[index - 1]?.receding
      if (beneath && shade && covering) {
        const span = landing.enter - landing.leave || 1
        const start = ((landing.enter - covering.enter) / span) * 1000
        const recede = { ease: 'linear', duration: 1000 - start }
        timeline
          .add(beneath, { scale: [1, 0.94], ...recede }, start)
          .add(shade, { opacity: [0, 0.28], ...recede }, start)
      }
      scrubs.push(() =>
        scrub(timeline, {
          target: stack,
          enter: `${landing.enter} ${inFlow(index)}`,
          leave: `${landing.leave} ${inFlow(index)}`,
          sync: true,
        })
      )
    })
    scrubs.forEach((start) => start())

    // The sheets share one height and the slots are in pixels: rebuild when
    // the height changes (a new width, fonts arriving).
    let height = cards[0]!.offsetHeight
    const resizes = new ResizeObserver(() => {
      const now = cards[0]!.offsetHeight
      if (Math.abs(now - height) < 1) return
      height = now
      scope.refresh()
    })
    resizes.observe(cards[0]!)
    cleanups.push(() => resizes.disconnect())
  } else {
    sheets.forEach((sheet, index) => {
      if (!sheet || !belowFold(sheet)) return
      animate(sheet, {
        y: [48, 0],
        opacity: [0, 1],
        duration: 800,
        ease: 'out(3)',
        autoplay: arrival(cards[index]!, '90% top'),
      })
    })
  }

  const funnel = root.querySelector<HTMLElement>('.sc-funnel')
  const funnelCard = funnel?.closest<HTMLElement>('.program-card')
  if (
    funnel &&
    funnelCard &&
    funnel.dataset.played === undefined &&
    belowFold(funnel)
  ) {
    const { timeline, settle } = funnelTimeline(funnel)
    // Reverting the scope mid-play must not leave overlays behind.
    cleanups.push(settle)
    utils.set(funnel.querySelectorAll('.sc-funnel-step'), { '--open': 0 })
    const play = () => {
      funnel.dataset.played = ''
      timeline.play()
    }
    if (stack) {
      // Just before its card takes its slot.
      const slot = parseFloat(getComputedStyle(funnelCard).top)
      arrival(stack, `${slot + 2} ${inFlow(cards.indexOf(funnelCard))}`, play)
    } else {
      arrival(funnelCard, '80% top', play)
    }
  }

  return () => cleanups.forEach((cleanup) => cleanup())
}

export default programs
