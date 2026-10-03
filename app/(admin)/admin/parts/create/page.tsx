/**
 * 파트 생성 화면(`/admin/parts/create`). 권한은 레이아웃이 확인한다.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/admin/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { createPartAction } from '@/app/(admin)/admin/parts/create/actions'
import { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'
import { Metadata } from 'next'
import PartFormFields from '@/app/(admin)/admin/parts/_components/part-form-fields'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { getAuthSession } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Create Part',
}

/** 파트 생성 폼. */
export default async function CreatePartPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const session = await getAuthSession()
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
        <div className={'admin-panel'}>
          <div className={'font-semibold'}>
            {t.selectSpecificGenerationToCreate}
          </div>
        </div>
      </AdminDefaultLayout>
    )
  }

  const membersData = await getPartMemberOptions()

  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>
        {t.create} {t.part}
      </div>
      <DataForm action={createPartAction} className={'admin-form-grid gap-2'}>
        <PartFormFields
          t={t}
          generation={resolvedScope.selectedGeneration}
          members={membersData}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
