/**
 * 허브 페이지(세션·프로젝트·멤버·캘린더)의 "홈 / 섹션" 경로 표시(서버 컴포넌트).
 */
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import { toLocale } from '@/lib/i18n'

/**
 * "홈 / 세션" 같은 경로 표시. `params`(언어)가 필요하므로 허브는 이 컴포넌트를 별도
 * Suspense 영역에 두어, 공유 셸이 URL에 의존하지 않고 미리 렌더링되게 한다.
 * @param section 현재 허브
 */
export default async function HubBreadcrumbs({
  params,
  section,
}: {
  params: Promise<{ lang: string }>
  section: 'sessions' | 'projects' | 'members' | 'calendar'
}) {
  const lang = toLocale((await params).lang)
  const copy = archiveCommonCopy[lang]

  return (
    <Breadcrumbs
      label={copy.breadcrumb}
      items={[{ label: copy.home, href: `/${lang}` }, { label: copy[section] }]}
    />
  )
}
