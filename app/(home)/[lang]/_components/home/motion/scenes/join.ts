/**
 * 참여(join) 섹션의 연출: 괄호 등장, 망점 물결, 괄호 드래그.
 *
 * 장면 함수 규칙은 `../scene.ts` 참고.
 */
import { createDraggable, spring, stagger } from 'animejs'
import { fieldShape, nearestCell } from '@/lib/motion/field'
import { SPRINGS } from '@/lib/motion/springs'
import { CAPSULE_HEX } from '@/lib/site/brand'
import { arrival } from '../arrival'
import { createDotField } from '../dot-field'
import type { Scene } from '../scene'
import { scrub } from '../scrub'
import { sceneTimeline } from '../timeline'

const DOT_COLOURS = Object.values(CAPSULE_HEX)

/** 대략 52px마다 점 하나, 최대 220개. */
const DOT_SPACING = 52
const DOT_CAP = 220

/**
 * `<join>` 장면(페이지의 마지막 장). 섹션이 들어오면 괄호가 양쪽 끝에서 날아와 살짝 지나쳤다가
 * 제목을 감싸며 닫히고, 제목 단어가 튀어 오른다. 이어서 행동 유도 버튼 뒤의 GDG 망점 필드가
 * 가운데에서 물결치고, 무대를 탭한 곳에서도 물결이 퍼진다. 정밀 포인터로는 괄호를 끌어당길 수
 * 있고, 놓으면 제자리로 튕겨 돌아간다.
 */
const join: Scene = ({ root, scope, matches }) => {
  const inner = root.querySelector<HTMLElement>('.join-inner')
  const [left, right] = root.querySelectorAll<HTMLElement>('.join-bracket')
  if (!inner || !left || !right) return

  const closing = sceneTimeline({
    defaults: { duration: 1000, ease: 'out(3)' },
    autoplay: false,
  })
    .add(
      left,
      {
        x: ['-38vw', 0],
        rotate: [-16, 0],
        scale: [0.8, 1],
        opacity: [0.35, 1],
      },
      0
    )
    .add(
      right,
      { x: ['38vw', 0], rotate: [16, 0], scale: [0.8, 1], opacity: [0.35, 1] },
      0
    )
    .add(
      root.querySelectorAll('.join-word'),
      {
        y: ['35%', '0%'],
        scale: [0.9, 1],
        duration: 400,
        ease: 'out(4)',
        delay: stagger(80),
      },
      600
    )
  scrub(closing, {
    target: root,
    enter: 'bottom top',
    leave: 'center center',
    sync: 0.4,
  })

  const [columns, rows] = fieldShape(
    root.offsetWidth,
    root.offsetHeight,
    DOT_SPACING,
    DOT_CAP
  )
  const field = createDotField(root, {
    columns,
    rows,
    colours: DOT_COLOURS,
    className: 'join-field',
  })
  const waveFrom = (point: { x: number; y: number }) =>
    field.wave(nearestCell(point, root.getBoundingClientRect(), columns, rows))

  // 괄호가 닫히고 나면 필드가 가운데에서 물결친다.
  arrival(root, 'center center', () => field.wave('center'))

  // 무대를 탭하면(링크나 괄호가 아닌 곳) 그 자리에서 물결이 퍼진다.
  const onTap = (event: PointerEvent) => {
    const target = event.target as Element | null
    if (target?.closest('a, button, .bracket-poster')) return
    waveFrom({ x: event.clientX, y: event.clientY })
  }
  root.addEventListener('pointerdown', onTap)

  // 정밀 포인터로 괄호를 끌어당길 수 있고, 놓으면 제자리로 튕겨 돌아간다.
  // 포인터가 처음 닿을 때 드래그를 붙인다. 장면을 준비할 때 두 괄호 모두를 위해 무대를 측정하면
  // 스크롤 중에 긴 프레임이 생겼기 때문이다.
  const grips: Array<() => void> = []
  if (matches.fine) {
    scope.add('grip', (poster: HTMLElement) => {
      createDraggable(poster, {
        container: inner,
        // 스냅 지점은 하나뿐이라 어디서 놓든 제자리로 돌아간다.
        x: { snap: [0] },
        y: { snap: [0] },
        releaseEase: spring(SPRINGS.snap),
        onGrab: () => {
          const box = poster.getBoundingClientRect()
          waveFrom({ x: box.left + box.width / 2, y: box.top + box.height / 2 })
        },
      })
    })
    for (const bracket of [left, right]) {
      const poster = bracket.querySelector<HTMLElement>('.bracket-poster')
      if (!poster) continue
      const grip = () => void scope.methods.grip?.(poster)
      poster.addEventListener('pointerenter', grip, { once: true })
      grips.push(() => poster.removeEventListener('pointerenter', grip))
    }
  }

  return () => {
    root.removeEventListener('pointerdown', onTap)
    grips.forEach((release) => release())
    field.remove()
  }
}

export default join
