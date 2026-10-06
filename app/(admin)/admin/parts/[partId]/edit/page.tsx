import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import { requireGenerationAccess } from '@/lib/server/permission/require-permission'
import SubmitButton from '@/app/components/admin/submit-button'
import { getPart } from '@/lib/server/fetcher/admin/get-part'
import { updatePartAction } from '@/app/(admin)/admin/parts/[partId]/edit/actions'
import DataForm from '@/app/components/admin/data-form'
import { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'
import { Metadata } from 'next'
import { savedVersionKey } from '@/lib/admin/form-version'
import PartFormFields from '@/app/(admin)/admin/parts/_components/part-form-fields'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { getAuthSession } from '@/auth'
import {
  resolveAdminGenerationScope,
  canSwitchToGeneration,
} from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: 'Edit Part',
}

export default async function EditPartPage({
  params,
}: PageProps<'/admin/parts/[partId]/edit'>) {
  await connection()
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { partId } = await params
  const partData = await getPart(Number(partId))
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
      {/* Next가 방문 페이지를 유지하므로, 저장 버전을 key로 써 비제어 입력에 최신 저장값을 채운다. */}
      <DataForm
        key={savedVersionKey(partData.updatedAt)}
        action={updatePartActionWithPartId}
        className={'admin-form-grid w-full gap-4'}
      >
        <PartFormFields
          t={t}
          generation={{
            id: actualGeneration?.id ?? partData.generationsId,
            name: actualGeneration?.name,
          }}
          members={membersData.filter(
            (member) =>
              !partData.usersToParts.some(
                (membership) =>
                  membership.userId === member.id &&
                  membership.userType !== 'Primary' &&
                  membership.userType !== 'Secondary'
              )
          )}
          part={partData}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
