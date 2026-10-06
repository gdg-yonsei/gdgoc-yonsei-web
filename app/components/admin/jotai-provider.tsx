'use client'

/** 업로드·확인 모달 상태는 관리자 트리 안에서만 공유한다. */
import { Provider } from 'jotai'
import { ReactNode } from 'react'

export default function JotaiProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}
