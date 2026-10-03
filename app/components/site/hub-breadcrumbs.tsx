/**
 * 허브 페이지(세션·프로젝트·멤버·캘린더)의 "홈 / 섹션" 경로 표시(서버 컴포넌트).
 */
import Breadcrumbs from '@/app/components/site/breadcrumbs'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import { getLocale } from '@/lib/i18n/server'
import { localeHref } from '@/lib/site/routes'

/**
 * "홈 / 세션" 같은 경로 표시. 언어(`getLocale()`)를 읽으므로 허브는 이 컴포넌트를 별도
 * Suspense 영역에 두어, 공유 셸이 URL에 의존하지 않고 미리 렌더링되게 한다.
 * @param section 현재 허브
 */
export default async function HubBreadcrumbs({
  section,
}: {
  section: 'sessions' | 'projects' | 'members' | 'calendar'
}) {
  const lang = await getLocale()
  const copy = archiveCommonCopy[lang]

  return (
    <Breadcrumbs
      label={copy.breadcrumb}
      items={[
        { label: copy.home, href: localeHref(lang) },
        { label: copy[section] },
      ]}
    />
  )
}
