'use client'

/**
 * 관리자 영역의 Jotai 상태 범위(클라이언트 컴포넌트). 업로드 중 여부, 확인 모달 같은 전역 UI 상태를 관리자 트리 안에서만 공유한다.
 */
import { Provider } from 'jotai'
import { ReactNode } from 'react'

/** Jotai `Provider`로 하위 트리를 감싼다. */
export default function JotaiProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}
