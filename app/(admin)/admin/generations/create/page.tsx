import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import { createGenerationAction } from '@/app/(admin)/admin/generations/create/actions'
import SubmitButton from '@/app/components/admin/submit-button'

import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

export const metadata: Metadata = {
  title: 'Create Generation',
}

export default async function CreateGenerationPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)

  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>
        {t.create} {t.generation}
      </div>
      <DataForm
        action={createGenerationAction}
        className={'admin-form-grid gap-2'}
      >
        <DataInput
          title={t.generation}
          defaultValue={''}
          name={'name'}
          placeholder={'e.g. 1st, 2nd, ...'}
        />
        <DataInput
          title={t.startTime}
          defaultValue={''}
          name={'startDate'}
          placeholder={'YYYY-MM-DD'}
          type={'date'}
        />
        <DataInput
          title={t.endTime}
          defaultValue={''}
          name={'endDate'}
          placeholder={'YYYY-MM-DD'}
          type={'date'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
