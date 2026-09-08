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
import { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'
import PartMembersInput from '@/app/components/admin/part-members-input'
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
  const membersData = await getPartMemberOptions()

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
        <DataInput
          title={t.displayOrder}
          name="displayOrder"
          type="number"
          required
          defaultValue={partData.displayOrder}
          placeholder="10"
        />
        <p className="text-ink-muted text-sm">
          {locale === 'ko'
            ? '작은 숫자의 파트부터 표시됩니다.'
            : 'Parts with smaller numbers appear first.'}
        </p>
        <DataTextarea
          defaultValue={partData.description}
          name={'description'}
          placeholder={'Description'}
        />
        <div className={'admin-form-grid-full admin-card'}>
          <div className={'admin-field-label'}>{t.generation}</div>
          <div className={'admin-field-value'}>{actualGeneration?.name}</div>
        </div>
        <PartMembersInput
          members={membersData.filter(
            (member) =>
              !partData.usersToParts.some(
                (membership) =>
                  membership.userId === member.id &&
                  membership.userType !== 'Primary' &&
                  membership.userType !== 'Secondary'
              )
          )}
          name={'membersList'}
          title={t.members}
          defaultValue={membersIdList}
        />
        <PartMembersInput
          members={membersData.filter(
            (member) =>
              !partData.usersToParts.some(
                (membership) =>
                  membership.userId === member.id &&
                  membership.userType !== 'Primary' &&
                  membership.userType !== 'Secondary'
              )
          )}
          name={'doubleBoardMembersList'}
          title={t.doubleBoardMembers}
          defaultValue={doubleBoardMembersIdList}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
