import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { createPartAction } from '@/app/(admin)/admin/parts/create/actions'
import DataTextarea from '@/app/components/admin/data-textarea'
import DataSelectMultipleInput from '@/app/components/admin/data-select-multiple-input'
import formatUserName from '@/lib/format-user-name'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

export const metadata: Metadata = {
  title: 'Create Part',
}

/**
 * `CreatePartPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function CreatePartPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await auth()
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null

  if (
    resolvedScope?.scope?.kind !== 'generation' ||
    !resolvedScope.selectedGeneration
  ) {
    return (
      <AdminDefaultLayout>
        <div className={'admin-title'}>
          {t.create} {t.part}
        </div>
        <div className={'rounded-2xl bg-white p-6 text-neutral-700'}>
          <div className={'font-semibold'}>
            {t.selectSpecificGenerationToCreate}
          </div>
        </div>
      </AdminDefaultLayout>
    )
  }

  const membersData = await getMembers(null)
  const uniqueMembers = Array.from(
    new Map(membersData.map((m) => [m.id, m])).values()
  )

  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>
        {t.create} {t.part}
      </div>
      <DataForm action={createPartAction} className={'member-data-grid gap-2'}>
        <input
          hidden={true}
          name={'generationId'}
          readOnly={true}
          value={String(resolvedScope.selectedGeneration.id)}
        />
        <DataInput
          title={t.name}
          defaultValue={''}
          name={'name'}
          placeholder={'e.g. Android, iOS, ...'}
        />
        <DataTextarea
          defaultValue={''}
          name={'description'}
          placeholder={'e.g. This is a part for Android developers.'}
        />
        <div
          className={
            'member-data-box col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4'
          }
        >
          <div className={'member-data-title'}>{t.generation}</div>
          <div className={'member-data-content'}>
            {resolvedScope.selectedGeneration.name}
          </div>
        </div>
        <DataSelectMultipleInput
          data={uniqueMembers.map((member) => ({
            name: formatUserName(
              member.name,
              member.firstName,
              member.lastName
            ),
            value: member.id,
          }))}
          name={'membersList'}
          title={t.members}
          defaultValue={[]}
        />
        <DataSelectMultipleInput
          data={uniqueMembers.map((member) => ({
            name: formatUserName(
              member.name,
              member.firstNameKo,
              member.lastNameKo,
              member.isForeigner,
              !member.isForeigner
            ),
            value: member.id,
          }))}
          name={'doubleBoardMembersList'}
          title={t.doubleBoardMembers}
          defaultValue={[]}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
