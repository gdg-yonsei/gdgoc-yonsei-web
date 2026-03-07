import { getSessions } from '@/lib/server/fetcher/admin/get-sessions'
import SessionCard from '@/app/(admin)/admin/sessions/sessionCard'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

/**
 * `SessionsTable` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function SessionsTable() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const sessionsData = await getSessions()

  return (
    <div className={'flex w-full flex-col gap-2'}>
      {sessionsData?.map((generation) => (
        <div key={generation.id}>
          <div
            className={'border-b-2 border-neutral-300 text-sm text-neutral-600'}
          >
            {t.generation}: {generation.name}
          </div>
          <div className={'member-data-grid w-full gap-2 pt-2'}>
            {generation?.parts?.map((part) =>
              part.sessions.map((session) => (
                <SessionCard session={session} key={session.id} locale={locale} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
