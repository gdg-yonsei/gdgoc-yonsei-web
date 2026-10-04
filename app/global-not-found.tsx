/**
 * 전역 404 페이지(Next `global-not-found`). 어떤 경로와도 맞지 않는 URL에 쓰인다.
 *
 * 루트 레이아웃이 공개 사이트(`app/(home)/[lang]`)와 관리자(`app/(admin)`) 두 개라 404를 감쌀 공통 레이아웃이
 * 없다. 그래서 Next는 렌더링 없이 이 문서를 바로 돌려주고, 이 파일이 `<html>`·스타일·폰트를 직접 갖춘다.
 * 공개 페이지 안에서 `notFound()`를 부르면 `app/(home)/[lang]/not-found.tsx`가 사이트 셸 안에 그린다.
 */
import type { Metadata } from 'next'
import './site.css'
import NotFoundView from '@/app/components/site/not-found-view'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { cn } from '@/lib/cn'
import { rootMetadata, rootViewport } from '@/lib/seo/metadata'

/** 404 페이지 메타데이터. */
export const metadata: Metadata = {
  ...rootMetadata(),
  title: '404 Not Found | GDGoC Yonsei',
  description: 'Google Developer Group on Campus Yonsei University',
}

/** 모바일 뷰포트 설정. */
export const viewport = rootViewport

/** 404 화면. 언어를 알 수 없어 영어 문서로 그리고 본문은 두 언어로 보여 준다. */
export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={cn('site', googleSansFlex.variable, googleSansCode.variable)}
      data-color-scheme="auto"
    >
      <body className="bg-stage text-on-stage">
        <main>
          <NotFoundView />
        </main>
      </body>
    </html>
  )
}
