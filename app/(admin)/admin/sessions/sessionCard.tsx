import { type AdminSessionListItem } from '@/lib/server/fetcher/admin/get-sessions'
import Link from 'next/link'
import Image from 'next/image'
import {
  formatAdminDate,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'

/**
 * `SessionCard` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default function SessionCard({
  session,
  locale,
}: {
  session: Pick<AdminSessionListItem, 'id' | 'mainImage' | 'name' | 'startAt'> &
    Partial<Pick<AdminSessionListItem, 'partName'>>
  locale: Locale
}) {
  const t = getAdminMessages(locale)
  return (
    <Link
      href={localizeAdminHref(`/admin/sessions/${session.id}`, locale)}
      className={'flex flex-col rounded-xl bg-white'}
    >
      <Image
        src={session.mainImage}
        alt={'Main Image'}
        width={600}
        height={400}
        className={'aspect-3/2 w-full rounded-t-xl object-cover'}
        placeholder={'blur'}
        blurDataURL={'/default-image.png'}
      />
      <div
        className={'flex h-full flex-col items-start justify-between p-2 px-4'}
      >
        <div>
          <div className={'text-xl font-semibold'}>{session.name}</div>
          {session.partName && (
            <div className={'text-sm text-neutral-600'}>{session.partName}</div>
          )}
        </div>
        <div className={'flex flex-col text-sm'}>
          {session.startAt
            ? formatAdminDate(session.startAt, locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : t.tbd}
        </div>
      </div>
    </Link>
  )
}
