import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getGeneration } from '@/lib/fetcher/get-generation'
import { notFound } from 'next/navigation'
import { updateGenerationAction } from '@/app/admin/generations/[generationId]/edit/actions'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import DataForm from '@/app/admin/generations/[generationId]/edit/data-form'

export default async function EditGenerationPage({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const { generationId } = await params
  const generationData = await getGeneration(Number(generationId))

  if (!generationData) {
    notFound()
  }

  const updateGenerationActionWithGenerationId = updateGenerationAction.bind(
    null,
    generationId
  )

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/generations/${generationId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Generation: {generationData.name}</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        Edit Generation: {generationData.name}
      </div>
      <DataForm
        action={updateGenerationActionWithGenerationId}
        className={'w-full gap-4 member-data-grid'}
      >
        <DataInput
          defaultValue={generationData.name}
          name={'name'}
          placeholder={'Generation Name'}
        />
        <DataInput
          defaultValue={generationData.startDate}
          name={'startDate'}
          placeholder={'Start Date'}
        />
        <DataInput
          defaultValue={generationData.endDate}
          name={'endDate'}
          placeholder={'End Date'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
