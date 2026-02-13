import Link from 'next/link'
import getLatestGeneration from '@/lib/server/fetcher/getLastGeneration'
import AdminDashboardLink from '@/app/components/header/gyms-navigation'
import { Suspense } from 'react'
import { Locale } from '@/i18n-config'

/**
 * `DesktopNavigationList` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function DesktopNavigationList({
  lang,
}: {
  lang: Locale
}) {
  const lastGeneration = await getLatestGeneration()
  return (
    <div
      className={
        'flex items-center gap-2 text-lg *:p-1 *:px-4 not-md:hidden *:hover:underline'
      }
    >
      <Suspense>
        <AdminDashboardLink />
      </Suspense>
      <Link
        href={`/${lang}/session${lastGeneration ? '/' + lastGeneration.name : ''}`}
      >
        {lang === 'ko' ? '세션' : 'Session'}
      </Link>
      <Link
        href={`/${lang}/project${lastGeneration ? '/' + lastGeneration.name : ''}`}
      >
        {lang === 'ko' ? '프로젝트' : 'Project'}
      </Link>
      <Link href={`/${lang}/calendar`}>
        {lang === 'ko' ? '캘린더' : 'Calendar'}
      </Link>
      <Link
        href={`/${lang}/member${lastGeneration ? '/' + lastGeneration.name : ''}`}
      >
        {lang === 'ko' ? '구성원' : 'Member'}
      </Link>
    </div>
  )
}
