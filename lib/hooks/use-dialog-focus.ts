/**
 * 모달 대화상자의 키보드 접근성 처리: ESC로 닫기, Tab 포커스 가두기, 닫은 뒤 포커스 되돌리기.
 *
 * 관리자 확인 모달(`modal.tsx`)과 모바일 메뉴 드로어(`menu-bar.tsx`)가 같은 규칙을 쓰도록
 * 한 곳에 모아 둔다. 클라이언트 컴포넌트에서만 호출한다.
 */
import { useEffect, useEffectEvent, type RefObject } from 'react'

/** 대화상자 안에서 Tab으로 이동할 수 있는 요소 선택자. */
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 열려 있는 동안 포커스를 `panelRef` 안에 가두고, 닫히면 열기 직전에 포커스가 있던 요소로 되돌린다.
 *
 * @param isOpen 대화상자가 열려 있는지
 * @param panelRef 대화상자 패널 요소
 * @param onClose ESC를 눌렀을 때 호출한다
 * @param initialFocusRef 열릴 때 처음 포커스할 요소. 생략하면 패널의 첫 번째 포커스 가능 요소.
 *   파괴적 확인 모달은 "취소" 버튼을 넘겨, Enter 한 번에 삭제되는 일을 막는다.
 */
export function useDialogFocus({
  isOpen,
  panelRef,
  onClose,
  initialFocusRef,
}: {
  isOpen: boolean
  panelRef: RefObject<HTMLElement | null>
  onClose: () => void
  initialFocusRef?: RefObject<HTMLElement | null>
}) {
  // onClose가 렌더마다 새로 만들어져도 effect를 다시 등록하지 않도록 Effect Event로 감싼다.
  const handleEscape = useEffectEvent(onClose)

  useEffect(() => {
    if (!isOpen) return

    const restoreTarget = document.activeElement as HTMLElement | null
    const initialTarget =
      initialFocusRef?.current ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    initialTarget?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleEscape()
        return
      }
      if (event.key !== 'Tab') return

      const nodes =
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      const first = nodes?.[0]
      const last = nodes?.[nodes.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      restoreTarget?.focus()
    }
  }, [isOpen, panelRef, initialFocusRef])
}
