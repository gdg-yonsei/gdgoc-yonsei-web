/**
 * 파트 수정 화면(`/admin/parts/{id}/edit`). 권한은 레이아웃이 확인하고, 항목이 없으면 404.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import { requireGenerationAccess } from '@/lib/server/permission/require-permission'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { getPart } from '@/lib/server/fetcher/admin/get-part'
import { updatePartAction } from '@/app/(admin)/admin/parts/[partId]/edit/actions'
import DataTextarea from '@/app/components/admin/data-textarea'
import DataForm from '@/app/components/admin/data-form'
import { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'
import PartMembersInput from '@/app/components/admin/part-members-input'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { getAuthSession } from '@/auth'
import {
  resolveAdminGenerationScope,
  canSwitchToGeneration,
} from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import { connection } from 'next/server'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Edit Part',
}

/** 기존 값을 채운 파트 수정 폼. */
export default async function EditPartPage({
  params,
}: {
  params: Promise<{ partId: string }>
}) {
  await connection()
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { partId } = await params
  const partData = await getPart(Number(partId))
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

  if (!partData) {
    notFound()
  }
  // 다른 기수의 파트는 URL을 알아도 볼 수 없다.
  await requireGenerationAccess(partData.generationsId)

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
          canSwitch={canSwitchToGeneration(resolvedScope, actualGeneration.id)}
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
      {/* Next keeps visited pages mounted; a new key per saved version resets
          the uncontrolled fields instead of showing the previous edit's input. */}
      <DataForm
        key={partData.updatedAt?.toISOString() ?? 'new'}
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
        <p className="text-ink-muted text-sm">{t.displayOrderHint}</p>
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
