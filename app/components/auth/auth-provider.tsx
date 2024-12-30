'use client'

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'

/**
 * Auth.js Session Provider
 * @param children
 * @constructor
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
