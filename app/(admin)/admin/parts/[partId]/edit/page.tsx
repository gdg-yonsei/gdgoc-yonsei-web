import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { getPart } from '@/lib/server/fetcher/admin/get-part'
import { updatePartAction } from '@/app/(admin)/admin/parts/[partId]/edit/actions'
import DataTextarea from '@/app/components/admin/data-textarea'
import DataForm from '@/app/components/data-form'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import DataSelectMultipleInput from '@/app/components/admin/data-select-multiple-input'
import formatUserName from '@/lib/format-user-name'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { getAuthSession } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: 'Edit Part',
}

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ partId: string }>
}) {
  await connection()
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { partId } = await params
  // Part 정보 가져오기
  const partData = await getPart(Number(partId))
  // 파트에 속한 멤버 정보 리스트
  const membersIdList = partData
    ? partData.usersToParts
        .filter((userToPart) => userToPart.userType === 'Primary')
        .map((user) => user.user.id)
    : []

  const doubleBoardMembersIdList = partData
    ? partData.usersToParts
        .filter((userToPart) => userToPart.userType === 'Secondary')
        .map((user) => user.user.id)
    : []

  // 파트 정보가 없다면 404 페이지로 이동
  if (!partData) {
    notFound()
  }

  // Part 정보 업데이트 Action
  const updatePartActionWithPartId = updatePartAction.bind(null, partId)
  const session = await getAuthSession()
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null
  const actualGeneration = partData.generation
    ? {
        id: partData.generation.id,
        name: partData.generation.name,
      }
    : null
  const membersData = await getMembers(null)
  const uniqueMembers = Array.from(
    new Map(membersData.map((m) => [m.id, m])).values()
  )

  return (
    <AdminDefaultLayout>
      {actualGeneration && (
        <AdminGenerationScopeMismatchNotice
          actualGeneration={actualGeneration}
          canSwitch={
            resolvedScope?.canAccessAll === true ||
            resolvedScope?.options.some(
              (option) => option.id === actualGeneration.id
            ) === true
          }
          currentScope={resolvedScope?.scope ?? null}
          locale={locale}
        />
      )}
      <AdminNavigationButton href={`/admin/parts/${partId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{partData.name}</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        {t.edit} {partData.name}
      </div>
      <DataForm
        action={updatePartActionWithPartId}
        className={'admin-form-grid w-full gap-4'}
      >
        <input
          hidden={true}
          name={'generationId'}
          readOnly={true}
          value={String(actualGeneration?.id ?? partData.generationsId ?? '')}
        />
        <DataInput
          title={t.name}
          defaultValue={partData.name}
          name={'name'}
          placeholder={'Name'}
        />
        <DataTextarea
          defaultValue={partData.description}
          name={'description'}
          placeholder={'Description'}
        />
        <div className={'admin-form-grid-full admin-card'}>
          <div className={'admin-field-label'}>{t.generation}</div>
          <div className={'admin-field-value'}>{actualGeneration?.name}</div>
        </div>
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
            generation: member.generation,
            part: member.part,
          }))}
          name={'membersList'}
          title={t.members}
          defaultValue={membersIdList}
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
            generation: member.generation,
            part: member.part,
          }))}
          name={'doubleBoardMembersList'}
          title={t.doubleBoardMembers}
          defaultValue={doubleBoardMembersIdList}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
