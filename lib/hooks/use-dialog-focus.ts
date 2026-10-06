import { useEffect, useEffectEvent, type RefObject } from 'react'

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// 열릴 때 initialFocusRef 또는 첫 포커스 요소를 쓰며 닫히면 원래 포커스로 돌아간다.
// 파괴적 확인 모달은 취소 버튼을 넘겨 Enter 한 번으로 삭제되지 않게 한다.
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
