/**
 * 아카이브 허브 페이지(세션·프로젝트·구성원·캘린더) 공통 골격.
 *
 * 골격(헤더, 제목, 설명)은 `params`를 읽지 않으므로 모든 언어 링크가 같은 즉시
 * 표시 셸(App Shell)을 공유한다. 언어는 `LocalizedText`가 CSS로 고른다.
 * URL이나 데이터에 의존하는 부분(브레드크럼, 본문)은 각자의 Suspense 경계 안에서
 * 스트리밍된다.
 */
import { Suspense, type ReactNode } from 'react'
import LocalizedText from '@/app/components/localized-text'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'

type Bilingual = { en: string; ko: string }

export default function ArchiveHubShell({
  params,
  section,
  testId,
  tag,
  title,
  description,
  fallback,
  children,
}: {
  params: Promise<{ lang: string }>
  section: 'sessions' | 'projects' | 'members' | 'calendar'
  /** e2e가 셸을 찾을 때 쓰는 `data-testid`. */
  testId?: string
  /** 제목 위 코드 모양 태그(예: `<sessions />`). */
  tag: string
  title: Bilingual
  description: Bilingual
  /** 본문을 기다리는 동안 보일 스켈레톤. */
  fallback: ReactNode
  /** `params`를 읽어 데이터를 그리는 본문(보통 async 서버 컴포넌트). */
  children: ReactNode
}) {
  return (
    <PageTransition>
      <div className="site-page" data-testid={testId}>
        <Suspense
          fallback={
            <div aria-hidden="true" className="site-breadcrumbs-skeleton" />
          }
        >
          <HubBreadcrumbs params={params} section={section} />
        </Suspense>
        <PageHeader
          tag={tag}
          title={<LocalizedText en={title.en} ko={title.ko} />}
          description={
            <LocalizedText en={description.en} ko={description.ko} />
          }
        />
        <Suspense fallback={fallback}>{children}</Suspense>
      </div>
    </PageTransition>
  )
}
