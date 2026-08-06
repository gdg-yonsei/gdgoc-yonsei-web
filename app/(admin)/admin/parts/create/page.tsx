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
        <div className={'admin-panel'}>
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
        <DataSelectMultipleInput
          data={uniqueMembers.map((member) => ({
            name: formatUserName(
              member.name,
              member.firstName,
              member.lastName
            ),
            value: member.id,
            generation: member.generation,
            part: member.part,
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
            generation: member.generation,
            part: member.part,
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
