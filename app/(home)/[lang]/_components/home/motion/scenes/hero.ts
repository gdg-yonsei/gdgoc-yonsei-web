/**
 * 히어로(첫 화면) 섹션의 스크롤 연출.
 *
 * 장면 함수 규칙은 `../scene.ts` 참고.
 */
import { animate, createAnimatable } from 'animejs'
import { magnetOffset } from '@/lib/motion/magnet'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

/** partingOffset()가 괄호를 움직이는 곡선. 단어도 같은 곡선으로 따라간다. */
const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * 히어로 장면: 스크롤로 무대가 멀어지면서 열린다. "GDGoC"와 "Yonsei"가 괄호와 함께 벌어지고,
 * 문구는 위로 떠오르며 흐려지고, 메타 정보 띠가 사라진다. 정밀 포인터(마우스)에서는 행동 유도
 * 버튼이 포인터 쪽으로 살짝 기운다.
 *
 * 망점·탭·시차 효과는 WebGL 필드(`bracket-stage`)가 맡고, 이 장면은 이미 화면에 보이는 글자만
 * 움직이므로 등장 시작 상태를 주지 않는다.
 */
const hero: Scene = ({ root, matches }) => {
  const [first, last] = root.querySelectorAll<HTMLElement>('.hero-word')
  const part = (selector: string) =>
    root.querySelector<HTMLElement>(selector) ?? []

  const opening = sceneTimeline({
    defaults: { ease: 'linear', duration: 1000 },
    autoplay: false,
  })
    .add(
      first ?? [],
      { x: [0, '-19vw'], opacity: [1, 0.15], ease: smoothstep },
      0
    )
    .add(
      last ?? [],
      { x: [0, '19vw'], opacity: [1, 0.15], ease: smoothstep },
      0
    )
    .add(part('.hero-foot'), { opacity: [1, 0], duration: 300 }, 0)
    .add(
      part('.hero-eyebrow'),
      { y: [0, -40], opacity: [1, 0], duration: 500 },
      0
    )
    .add(
      part('.hero-tagline'),
      { y: [0, -56], opacity: [1, 0], duration: 600 },
      60
    )
    .add(
      part('.hero-actions'),
      { y: [0, -72], opacity: [1, 0], duration: 600 },
      120
    )
  scrub(opening, {
    target: root,
    enter: 'start start',
    leave: 'start end',
    sync: 0.25,
  })

  // 스크롤 안내가 세 번 끄덕인 뒤 멈춘다.
  animate(part('.hero-cue'), {
    y: [
      { to: 6, ease: 'out(2)' },
      { to: 0, ease: 'in(2)' },
    ],
    duration: 900,
    loop: 2,
    delay: 400,
  })

  if (!matches.fine) return

  const links = [...root.querySelectorAll<HTMLElement>('.hero-actions > a')]
  const magnets = links.map((link) =>
    createAnimatable(link, {
      '--magnet-x': { unit: 'px' },
      '--magnet-y': { unit: 'px' },
      duration: 450,
      ease: 'out(3)',
    })
  )
  const lean = (to: (link: HTMLElement) => { x: number; y: number }) =>
    links.forEach((link, index) => {
      const { x, y } = to(link)
      magnets[index]?.['--magnet-x']?.(x)
      magnets[index]?.['--magnet-y']?.(y)
    })
  const onMove = (event: PointerEvent) =>
    lean((link) =>
      magnetOffset(
        { x: event.clientX, y: event.clientY },
        link.getBoundingClientRect()
      )
    )
  const onLeave = () => lean(() => ({ x: 0, y: 0 }))

  root.addEventListener('pointermove', onMove)
  root.addEventListener('pointerleave', onLeave)
  return () => {
    root.removeEventListener('pointermove', onMove)
    root.removeEventListener('pointerleave', onLeave)
  }
}

export default hero
