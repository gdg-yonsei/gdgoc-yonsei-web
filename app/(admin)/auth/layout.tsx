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

/** 로그인 화면과 MCP 동의 화면은 필요한 인증 상태가 달라, 이동을 각 페이지에서 정한다. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
