import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { createProjectAction } from '@/app/admin/projects/create/actions'

export default async function CreateProjectPage() {
  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Create New Project</div>
      <DataForm
        action={createProjectAction}
        className={'gap-2 member-data-grid'}
      >
        <DataInput
          title={'Name'}
          defaultValue={''}
          name={'name'}
          placeholder={'Name'}
        />
        <DataInput
          title={'Description'}
          defaultValue={''}
          name={'description'}
          placeholder={'Description'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
