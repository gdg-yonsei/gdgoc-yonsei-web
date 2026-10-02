/**
 * 루트 404 페이지(어떤 레이아웃에도 속하지 않는 경로). 공개 기수·상세 페이지의 404는 proxy가 처리한다.
 */
import type { Metadata } from 'next'
import './globals.css'
import NotFoundView from '@/app/components/site/not-found-view'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { cn } from '@/lib/cn'

/** 404 페이지 메타데이터. */
export const metadata: Metadata = {
  title: '404 Not Found | GDGoC Yonsei',
  description: 'Google Developer Group on Campus Yonsei University',
}

/** 404 화면. 언어를 알 수 없어 영어 문서로 그리고 본문은 두 언어로 보여 준다. */
export default function NotFound() {
  return (
    <html
      lang="en"
      className={cn('site', googleSansFlex.variable, googleSansCode.variable)}
      data-color-scheme="auto"
    >
      <body className="bg-stage text-on-stage">
        <NotFoundView />
      </body>
    </html>
  )
}
