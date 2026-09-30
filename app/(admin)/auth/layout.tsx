import { ReactNode } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'GYMS',
    template: '%s | GYMS',
  },
  description:
    'Google Developer Group on Campus Yonsei University Management System',
}

/**
 * 로그인 여부에 따른 이동은 각 페이지가 정한다.
 * 로그인 화면은 로그인한 사용자를 돌려보내고, MCP 동의 화면은 로그인한 사용자만 받는다.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
