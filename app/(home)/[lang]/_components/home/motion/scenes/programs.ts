/**
 * 프로그램 섹션의 연출: sticky 카드 묶음과 Solution Challenge 깔때기.
 *
 * 장면 함수 규칙은 `../scene.ts` 참고.
 */
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
 * Solution Challenge 깔때기 연출(한 번만 재생). 띠가 괄호가 벌어지듯 가운데에서 차례로 열리고, 숫자가
 * 올라가며, Top 10 띠가 망점으로 터진다. 숫자는 aria-hidden 오버레이에서 세므로 문서 안의 실제 숫자는
 * 바뀌지 않는다. 오버레이와 점은 연출이 끝나면 사라진다.
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

/**
 * `<programs>` 장면. sticky 카드 묶음에서 카드가 스티커처럼 붙고(기울기가 바로잡히고 번호가 뒤집혀
 * 나타남) 다음 카드 아래로 물러난다. Solution Challenge 카드가 자리를 잡을 때 깔때기 연출이 한 번
 * 재생된다. 휴대폰과 낮은 화면에서는 카드가 단순히 떠오르기만 한다.
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
  // 스크롤 기준선은 sticky 카드가 아니라 묶음(stack)에서 잰다. anime.js는 sticky 대상을 재려고 sticky를
  // 잠시 풀기 때문에 새로 고칠 때마다 전체 레이아웃이 일어난다. 행의 높이가 모두 같으므로 묶음 흐름에서
  // 카드의 위치는 정확히 계산된다.
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

    // 다음 카드가 덮을 때 각 카드는 자기 그림자 레이어로 어두워진다(카드의 CSS 변수를 움직이면 카드 안
    // 내용 전체의 스타일이 다시 계산됐다).
    const shades = sheets.map((sheet) => {
      if (!sheet) return null
      const shade = document.createElement('span')
      shade.className = 'program-shade'
      shade.setAttribute('aria-hidden', 'true')
      sheet.append(shade)
      return shade
    })
    cleanups.push(() => shades.forEach((shade) => shade?.remove()))

    // 카드마다 스크롤에 맞춘 타임라인 하나: 카드가 붙고(기울기 정리, 번호 뒤집힘), 같은 접근 구간의 뒷부분에서
    // 덮이는 카드가 물러난다. observer가 열한 개가 아니라 여섯 개다. 여섯 개 모두 페이지를 읽어 만든 뒤에
    // 시작 상태를 그리므로 스타일 재계산은 카드마다가 아니라 한 번이다.
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
      // 카드가 자리를 잡기 직전.
      const slot = parseFloat(getComputedStyle(funnelCard).top)
      arrival(stack, `${slot + 2} ${inFlow(cards.indexOf(funnelCard))}`, play)
    } else {
      arrival(funnelCard, '80% top', play)
    }
  }

  return () => cleanups.forEach((cleanup) => cleanup())
}

export default programs
