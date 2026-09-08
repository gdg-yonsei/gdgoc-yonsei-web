import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { createPartAction } from '@/app/(admin)/admin/parts/create/actions'
import DataTextarea from '@/app/components/admin/data-textarea'
import PartMembersInput from '@/app/components/admin/part-members-input'
import { getPartMemberOptions } from '@/lib/server/fetcher/admin/get-part-member-options'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { getAuthSession } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'

export const metadata: Metadata = {
  title: 'Create Part',
}

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
        <DataInput
          title={t.displayOrder}
          name="displayOrder"
          type="number"
          required
          defaultValue={10}
          placeholder="10"
        />
        <p className="text-ink-muted text-sm">
          {locale === 'ko'
            ? '작은 숫자의 파트부터 표시됩니다.'
            : 'Parts with smaller numbers appear first.'}
        </p>
        <DataTextarea
          defaultValue={''}
          name={'description'}
          placeholder={'e.g. This is a part for Android developers.'}
        />
        <div className={'admin-form-grid-full admin-card'}>
          <div className={'admin-field-label'}>{t.generation}</div>
          <div className={'admin-field-value'}>
            {resolvedScope.selectedGeneration.name}
          </div>
        </div>
        <PartMembersInput
          members={membersData}
          name={'membersList'}
          title={t.members}
          defaultValue={[]}
        />
        <PartMembersInput
          members={membersData}
          name={'doubleBoardMembersList'}
          title={t.doubleBoardMembers}
          defaultValue={[]}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
