import { getMember } from '@/lib/server/fetcher/admin/get-member'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import formatUserName from '@/lib/format-user-name'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { auth } from '@/auth'
import UserProfileImage from '@/app/components/user-profile-image'
import DataEditLink from '@/app/components/admin/data-edit-link'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'

/**
 * `generateMetadata` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params

  // Member 정보 가져오기
  const memberData = await getMember(memberId)

  return {
    title: `Member: ${memberData?.name}`,
  }
}

/**
 * `MemberPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function MemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { memberId } = await params

  // Member 정보 가져오기
  const memberData = await getMember(memberId)
  // 사용자 로그인 정보 가져오기
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/members'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.members}</p>
      </AdminNavigationButton>
      <div className={'flex w-full items-center justify-start gap-2 py-1'}>
        <div className={'admin-title'}>
          {formatUserName(
            memberData.name,
            memberData.firstName,
            memberData.lastName,
            memberData.isForeigner
          )}
        </div>

        <DataEditLink
          session={session}
          dataOwnerId={memberId}
          dataType={'members'}
          href={localizeAdminHref(`/admin/members/${memberId}/edit`, locale)}
        />
      </div>
      <div className={'member-data-grid w-full gap-2 py-2'}>
        <div className={'row-span-2 flex items-center justify-center'}>
          <UserProfileImage
            src={memberData.image}
            alt={'User Profile Image'}
            width={160}
            height={160}
            className={'aspect-square w-40 rounded-full'}
          />
        </div>
        <div className={'member-data-col-span'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
                <div className={'member-data-box'}>
                  <div className={'member-data-title'}>{t.firstNameEn}</div>
                  <div className={'member-data-content'}>{memberData.firstName}</div>
                </div>
                <div className={'member-data-box'}>
                  <div className={'member-data-title'}>{t.lastNameEn}</div>
                  <div className={'member-data-content'}>{memberData.lastName}</div>
                </div>
              </div>
            }
            koContent={
              <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
                <div className={'member-data-box'}>
                  <div className={'member-data-title'}>{t.firstNameKo}</div>
                  <div className={'member-data-content'}>{memberData.firstNameKo}</div>
                </div>
                <div className={'member-data-box'}>
                  <div className={'member-data-title'}>{t.lastNameKo}</div>
                  <div className={'member-data-content'}>{memberData.lastNameKo}</div>
                </div>
              </div>
            }
          />
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.email}</div>
          <div className={'member-data-content'}>{memberData.email}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.role}</div>
          <div className={'member-data-content'}>{memberData.role}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.part}</div>
          <div className={'member-data-content'}>{memberData.part}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.githubId}</div>
          <div className={'member-data-content'}>{memberData.githubId}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.instagramId}</div>
          <div className={'member-data-content'}>{memberData.instagramId}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.linkedInProfileUrl}</div>
          <div className={'member-data-content'}>{memberData.linkedInId}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.major}</div>
          <div className={'member-data-content'}>{memberData.major}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.studentId}</div>
          <div className={'member-data-content'}>{memberData.studentId}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.telephone}</div>
          <div className={'member-data-content'}>{memberData.telephone}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>{t.foreigner}</div>
          <div className={'member-data-content'}>
            {memberData.isForeigner ? t.trueValue : t.falseValue}
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
