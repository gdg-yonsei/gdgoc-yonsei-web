import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { createProjectAction } from '@/app/admin/projects/create/actions'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import MDXEditor from '@/app/components/admin/mdx-editor'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default async function CreateProjectPage() {
  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/projects'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Projects</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>Create New Project</div>
      <DataForm
        action={createProjectAction}
        className={'gap-2 member-data-grid'}
      >
        <div
          className={
            'col-span-1 sm:col-span-3 md:col-span-4 member-data-col-span grid grid-cols-1 sm:grid-cols-2 gap-2'
          }
        >
          <div>
            <DataImageInput title={'Main Image'} name={'mainImage'}>
              Select Main Image
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput name={'contentImages'} title={'Images'}>
              Select Images
            </DataMultipleImageInput>
          </div>
        </div>
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
