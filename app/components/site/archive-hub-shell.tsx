/** 셸은 lang을 읽지 않고 CSS LocalizedText로 언어를 골라, 모든 언어 링크가 즉시 표시 셸을 공유한다.
 * URL·데이터에 의존하는 경로 표시와 본문은 각 Suspense 경계에서 스트리밍한다. */
import { Suspense, type ReactNode } from 'react'
import LocalizedText from '@/app/components/localized-text'
import HubBreadcrumbs from '@/app/components/site/hub-breadcrumbs'
import PageHeader from '@/app/components/site/page-header'
import PageTransition from '@/app/components/site/page-transition'

type Bilingual = { en: string; ko: string }

export default function ArchiveHubShell({
  section,
  testId,
  tag,
  title,
  description,
  fallback,
  children,
}: {
  section: 'sessions' | 'projects' | 'members' | 'calendar'

  testId?: string

  tag: string
  title: Bilingual
  description: Bilingual

  fallback: ReactNode

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
          <HubBreadcrumbs section={section} />
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
