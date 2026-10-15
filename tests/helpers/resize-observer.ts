import { vi } from 'vitest'

/**
 * visx 차트가 크기를 재는 데 쓴다. jsdom에는 레이아웃이 없어 차트는 0px로 그려지고, 테스트는 표·요약·목록만 검증한다.
 * 전역 setup에 두면 ResizeObserver가 없는 환경을 검증하는 다른 테스트가 깨져 차트 테스트에서만 부른다.
 */
export function stubResizeObserver() {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
}
