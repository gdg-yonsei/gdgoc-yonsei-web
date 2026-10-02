/**
 * 프로젝트 상세 레이아웃. 빌드 시 미리 렌더링할 상세 경로(`generateStaticParams`)를 정한다.
 */
import type { ReactNode } from 'react'
import { getProjectStaticParams } from '@/lib/server/queries/public/static-params'

/** 빌드 시 미리 렌더링할 경로 매개변수(공개 데이터에서 만든다). */
export async function generateStaticParams() {
  return getProjectStaticParams()
}

/** 하위 페이지를 그대로 렌더링한다. */
export default function ProjectDetailLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
