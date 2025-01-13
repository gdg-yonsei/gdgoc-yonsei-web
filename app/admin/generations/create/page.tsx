import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import { createGenerationAction } from '@/app/admin/generations/create/actions'
import SubmitButton from '@/app/components/admin/submit-button'

export default function CreateGenerationPage() {
  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Create New Generation</div>
      <DataForm
        action={createGenerationAction}
        className={'gap-2 member-data-grid'}
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
        />
        <DataInput
          title={'End Date'}
          defaultValue={''}
          name={'endDate'}
          placeholder={'YYYY-MM-DD'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
