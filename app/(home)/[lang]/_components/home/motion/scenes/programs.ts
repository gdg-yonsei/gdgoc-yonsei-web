import { animate, stagger, utils, type Timeline } from 'animejs'
import { formatCount, parseCount } from '@/lib/motion/count'
import { stackPhases } from '@/lib/motion/stack'
import { CAPSULE_HEX } from '@/lib/site/brand'
import { arrival } from '../arrival'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

const BURST_COLOURS = Object.values(CAPSULE_HEX)

/** 숫자는 aria-hidden 오버레이에서 세어 문서의 실제 숫자를 유지하며, 오버레이·점은 연출 뒤 제거한다. */
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
      // 마지막 띠의 가운데, clip-path 바깥.
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

/** 휴대폰·낮은 화면에서는 카드를 쌓지 않고 등장 연출만 적용한다. */
const programs: Scene = ({ root, scope, matches, belowFold }) => {
  const cleanups: Array<() => void> = []
  const cards = [...root.querySelectorAll<HTMLElement>('.program-card')]
  const sheets = cards.map((card) =>
    card.querySelector<HTMLElement>('.program-inner')
  )
  const stack = matches.stack
    ? root.querySelector<HTMLElement>('.program-stack')
    : null
  // sticky 대상을 측정하면 anime.js가 고정을 풀어 전체 레이아웃이 일어나므로, 같은 높이의 카드 위치를 stack에서 계산한다.

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

    // 별도 그림자 레이어를 움직여, 카드 안 내용 전체의 스타일 재계산을 피한다.

    const shades = sheets.map((sheet) => {
      if (!sheet) return null
      const shade = document.createElement('span')
      shade.className = 'program-shade'
      shade.setAttribute('aria-hidden', 'true')
      sheet.append(shade)
      return shade
    })
    cleanups.push(() => shades.forEach((shade) => shade?.remove()))

    // 카드당 observer 하나를 쓰고 여섯 카드의 측정을 모두 끝낸 뒤 시작 상태를 그려, 스타일 재계산을 한 번으로 모은다.

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
      // scrub()이 돌려주는 애니메이션은 then이 있는 객체라 반환값으로 흘리지 않는다.
      scrubs.push(() => {
        scrub(timeline, {
          target: stack,
          enter: `${landing.enter} ${inFlow(index)}`,
          leave: `${landing.leave} ${inFlow(index)}`,
          sync: true,
        })
      })
    })
    scrubs.forEach((start) => start())

    // 카드 높이가 모두 같고 자리는 픽셀 단위이므로, 높이가 바뀌면(너비 변경, 폰트 로드) 다시 만든다.
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
    // 재생 중에 scope를 되돌려도 오버레이가 남지 않아야 한다.
    cleanups.push(settle)
    utils.set(funnel.querySelectorAll('.sc-funnel-step'), { '--open': 0 })
    const play = () => {
      funnel.dataset.played = ''
      timeline.play()
    }
    if (stack) {
      const slot = parseFloat(getComputedStyle(funnelCard).top)
      arrival(stack, `${slot + 2} ${inFlow(cards.indexOf(funnelCard))}`, play)
    } else {
      arrival(funnelCard, '80% top', play)
    }
  }

  return () => cleanups.forEach((cleanup) => cleanup())
}

export default programs
