import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { getAuthSession } from '@/auth'
import { getPart } from '@/lib/server/fetcher/admin/get-part'
import formatUserName from '@/lib/format-user-name'
import DataDeleteButton from '@/app/components/admin/data-delete-button'
import { Metadata } from 'next'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partId: string }>
}): Promise<Metadata> {
  const { partId } = await params
  // Part 데이터 가져오기
  const partData = await getPart(Number(partId))

  return {
    title: `Part: ${partData?.name}`,
  }
}

export default async function PartPage({
  params,
}: {
  params: Promise<{ partId: string }>
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { partId } = await params
  // Part 데이터 가져오기
  const partData = await getPart(Number(partId))
  // Part 데이터가 없으면 404 페이지 표시
  if (!partData) {
    notFound()
  }

  // 사용자 로그인 정보
  const session = await getAuthSession()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/parts'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.parts}</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>{partData.name}</div>
        <DataEditLink
          session={session}
          dataType={'parts'}
          href={localizeAdminHref(`/admin/parts/${partId}/edit`, locale)}
        />
        <DataDeleteButton
          session={session}
          dataType={'parts'}
          dataId={partId}
        />
      </div>
      <div className={'admin-form-grid gap-2'}>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.generation}</div>
          <div className={'admin-field-value'}>{partData.generation?.name}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.description}</div>
          <div className={'admin-field-value'}>{partData.description}</div>
        </div>
        <div className={'admin-form-grid-full'}>
          <div className={'admin-field-label'}>{t.members}</div>
          <div className={'admin-form-grid gap-2'}>
            {partData.usersToParts
              .filter((userToPart) => userToPart.userType === 'Primary')
              .map((user) => (
                <div key={user.user.id} className={'admin-card'}>
                  <div className={'admin-field-value'}>
                    {user.user.firstNameKo
                      ? formatUserName(
                          user.user.name,
                          user.user.firstNameKo,
                          user.user.lastNameKo,
                          user.user.isForeigner,
                          !user.user.isForeigner
                        )
                      : formatUserName(
                          user.user.name,
                          user.user.firstName,
                          user.user.lastName,
                          user.user.isForeigner
                        )}
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className={'admin-form-grid-full'}>
          <div className={'admin-field-label'}>{t.doubleBoardMembers}</div>
          <div className={'admin-form-grid gap-2'}>
            {partData.usersToParts
              .filter((userToPart) => userToPart.userType === 'Secondary')
              .map((user) => (
                <div key={user.user.id} className={'admin-card'}>
                  <div className={'admin-field-value'}>
                    {user.user.firstNameKo
                      ? formatUserName(
                          user.user.name,
                          user.user.firstNameKo,
                          user.user.lastNameKo,
                          user.user.isForeigner,
                          !user.user.isForeigner
                        )
                      : formatUserName(
                          user.user.name,
                          user.user.firstName,
                          user.user.lastName,
                          user.user.isForeigner
                        )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
