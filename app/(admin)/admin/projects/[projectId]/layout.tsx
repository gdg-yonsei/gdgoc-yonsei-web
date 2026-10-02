/**
 * 프로젝트 상세 이하 화면의 서버 레이아웃.
 *
 * `connection()`으로 이 구간을 요청 시점 렌더링으로 고정한다. 관리자 데이터는 사용자·권한마다
 * 다르므로 빌드 시 미리 렌더링하지 않는다.
 */
import type { ReactNode } from 'react'
import { connection } from 'next/server'

/** 하위 페이지를 그대로 렌더링한다. */
export default async function AdminProjectLayout({
  children,
}: {
  children: ReactNode
}) {
  await connection()

  return <>{children}</>
}
