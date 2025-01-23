import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { createProjectAction } from '@/app/admin/projects/create/actions'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import MDXEditor from '@/app/components/admin/mdx-editor'

export default async function CreateProjectPage() {
  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Create New Project</div>
      <DataForm
        action={createProjectAction}
        className={'gap-2 member-data-grid'}
      >
        <DataImageInput title={'Main Image'} name={'mainImage'}>
          Select Main Image
        </DataImageInput>
        <DataMultipleImageInput name={'images'} title={'Images'}>
          Select Images
        </DataMultipleImageInput>
        <DataInput
          title={'Name'}
          defaultValue={''}
          name={'name'}
          placeholder={'Name'}
        />
        <DataTextarea
          defaultValue={''}
          name={'description'}
          placeholder={'Description'}
        />
        <MDXEditor
          title={'Project Content'}
          name={'content'}
          placeholder={'Please write content'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
