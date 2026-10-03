/**
 * 멤버 상세 화면(`/admin/members/{id}`).
 *
 * 연락처(이메일·학번·전화)는 같은 기수 멤버·본인·LEAD에게만 보이고 그 외에는 "—"로 가린다.
 * 수정 버튼은 수정 화면과 같은 판단(`authorizeMemberEdit`)으로 보인다.
 */
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { formatUserName } from '@/lib/format/user-name'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getAuthSession } from '@/auth'
import UserProfileImage from '@/app/components/admin/user-profile-image'
import DataEditLink from '@/app/components/admin/data-edit-link'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { notFound } from 'next/navigation'
import { sharesGenerationWith } from '@/lib/server/services/admin/authorize'
import { authorizeMemberEdit } from '@/lib/server/services/admin/members'
import { getWebActor } from '@/lib/server/services/admin/web-actor'
import { Metadata } from 'next'

/** 탭 제목에 멤버 이름을 넣는다. 멤버가 없으면 404(조회는 page와 React cache로 공유된다). */
export async function generateMetadata({
  params,
}: PageProps<'/admin/members/[memberId]'>): Promise<Metadata> {
  const { memberId } = await params

  const memberData = await getMember(memberId)
  if (!memberData) {
    notFound()
  }

  return {
    title: `Member: ${memberData.name}`,
  }
}

/**
 * 멤버 프로필 상세.
 *
 * 여러 기수에 속한 멤버는 현재 선택한 기수의 소속(파트)을 보여 준다.
 */
export default async function MemberPage({
  params,
}: PageProps<'/admin/members/[memberId]'>) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { memberId } = await params
  const currentSession = await getAuthSession()
  const resolvedScope = currentSession?.user?.id
    ? await resolveAdminGenerationScope(currentSession.user.id)
    : null

  const memberData = await getMember(
    memberId,
    resolvedScope?.scope?.kind === 'generation'
      ? resolvedScope.scope.generationId
      : undefined
  )
  if (!memberData) {
    notFound()
  }
  // 연락처(이메일·학번·전화)는 같은 기수·본인·LEAD 에게만 보인다.
  const actor = await getWebActor()
  const showContact = actor
    ? await sharesGenerationWith(actor, memberId)
    : false
  const hidden = '—'
  // 수정 화면과 같은 판단(대상 역할·기수)으로 수정 버튼을 보인다.
  const canEdit = actor
    ? (await authorizeMemberEdit(actor, memberId)).ok
    : false

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
          allowed={canEdit}
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
          <div className={'admin-field-value'}>
            {showContact ? memberData.email : hidden}
          </div>
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
          <div className={'admin-field-value'}>
            {showContact ? memberData.studentId : hidden}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.telephone}</div>
          <div className={'admin-field-value'}>
            {showContact ? memberData.telephone : hidden}
          </div>
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
