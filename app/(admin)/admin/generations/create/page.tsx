import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import { createGenerationAction } from '@/app/(admin)/admin/generations/create/actions'
import SubmitButton from '@/app/components/admin/submit-button'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Generation',
}

export default function CreateGenerationPage() {
  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Create New Generation</div>
      <DataForm
        action={createGenerationAction}
        className={'member-data-grid gap-2'}
      >
        <DataInput
          title={'Generation Name'}
          defaultValue={''}
          name={'name'}
          placeholder={'Generation Name'}
        />
        <DataInput
          title={'Start Date'}
          defaultValue={''}
          name={'startDate'}
          placeholder={'YYYY-MM-DD'}
          type={'date'}
        />
        <DataInput
          title={'End Date'}
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
