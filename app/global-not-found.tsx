/** 공통 루트 레이아웃이 없어 `<html>`·스타일·폰트를 직접 갖춘다.
 * 공개 페이지 내부의 `notFound()`는 언어별 사이트 셸 안에서 렌더링한다. */
import type { Metadata } from 'next'
import './site.css'
import NotFoundView from '@/app/components/site/not-found-view'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { cn } from '@/lib/cn'
import { rootMetadata, rootViewport } from '@/lib/seo/metadata'

export const metadata: Metadata = {
  ...rootMetadata(),
  title: '404 Not Found | GDGoC Yonsei',
  description: 'Google Developer Group on Campus Yonsei University',
}

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
