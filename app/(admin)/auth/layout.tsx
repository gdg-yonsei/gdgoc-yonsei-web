/**
 * 인증 화면(로그인, MCP 동의) 레이아웃. 관리자 앱 셸(사이드바 등) 없이 화면만 그린다.
 */
import { ReactNode } from 'react'
import { Metadata } from 'next'

/** 인증 화면 제목 형식(`화면 | GYMS`). */
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
