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
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberId: string }>
}): Promise<Metadata> {
  const { memberId } = await params

  // Member 정보 가져오기
  const memberData = await getMember(memberId)
  if (!memberData) {
    notFound()
  }

  return {
    title: `Member: ${memberData.name}`,
  }
}

export default async function MemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { memberId } = await params
  const currentSession = await auth()
  const resolvedScope = currentSession?.user?.id
    ? await resolveAdminGenerationScope(currentSession.user.id)
    : null

  // Member 정보 가져오기
  const memberData = await getMember(
    memberId,
    resolvedScope?.scope?.kind === 'generation'
      ? resolvedScope.scope.generationId
      : undefined
  )
  if (!memberData) {
    notFound()
  }

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
          session={currentSession}
          dataOwnerId={memberId}
          dataType={'members'}
          href={localizeAdminHref(`/admin/members/${memberId}/edit`, locale)}
        />
      </div>
      <div className={'admin-form-grid w-full gap-2 py-2'}>
        <div className={'row-span-2 flex items-center justify-center'}>
          <UserProfileImage
            src={memberData.image}
            alt={'User Profile Image'}
            width={160}
            height={160}
            className={'aspect-square w-40 rounded-full'}
          />
        </div>
        <div className={'admin-form-grid-full'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
                <div className={'admin-card'}>
                  <div className={'admin-field-label'}>{t.firstNameEn}</div>
                  <div className={'admin-field-value'}>
                    {memberData.firstName}
                  </div>
                </div>
                <div className={'admin-card'}>
                  <div className={'admin-field-label'}>{t.lastNameEn}</div>
                  <div className={'admin-field-value'}>
                    {memberData.lastName}
                  </div>
                </div>
              </div>
            }
            koContent={
              <div className={'grid grid-cols-1 gap-2 sm:grid-cols-2'}>
                <div className={'admin-card'}>
                  <div className={'admin-field-label'}>{t.firstNameKo}</div>
                  <div className={'admin-field-value'}>
                    {memberData.firstNameKo}
                  </div>
                </div>
                <div className={'admin-card'}>
                  <div className={'admin-field-label'}>{t.lastNameKo}</div>
                  <div className={'admin-field-value'}>
                    {memberData.lastNameKo}
                  </div>
                </div>
              </div>
            }
          />
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.email}</div>
          <div className={'admin-field-value'}>{memberData.email}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.role}</div>
          <div className={'admin-field-value'}>{memberData.role}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.generation}</div>
          <div className={'admin-field-value'}>{memberData.generation}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.part}</div>
          <div className={'admin-field-value'}>{memberData.part}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.githubId}</div>
          <div className={'admin-field-value'}>{memberData.githubId}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.instagramId}</div>
          <div className={'admin-field-value'}>{memberData.instagramId}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.linkedInProfileUrl}</div>
          <div className={'admin-field-value'}>{memberData.linkedInId}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.major}</div>
          <div className={'admin-field-value'}>{memberData.major}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.studentId}</div>
          <div className={'admin-field-value'}>{memberData.studentId}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.telephone}</div>
          <div className={'admin-field-value'}>{memberData.telephone}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.foreigner}</div>
          <div className={'admin-field-value'}>
            {memberData.isForeigner ? t.trueValue : t.falseValue}
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
