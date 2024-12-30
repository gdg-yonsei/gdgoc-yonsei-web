'use client'

import { Provider } from 'jotai'
import { ReactNode } from 'react'

/**
 * Jotai State Provider
 * @param children
 * @constructor
 */
export default function JotaiProvider({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}
