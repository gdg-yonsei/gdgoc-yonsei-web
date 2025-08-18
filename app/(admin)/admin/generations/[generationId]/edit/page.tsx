import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import { notFound } from 'next/navigation'
import { updateGenerationAction } from '@/app/(admin)/admin/generations/[generationId]/edit/actions'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import DataForm from '@/app/components/data-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Generation',
}

export default async function EditGenerationPage({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const { generationId } = await params
  // generation 데이터 가져오기
  const generationData = await getGeneration(Number(generationId))

  // generation 데이터가 없을 경우 404 페이지로 이동
  if (!generationData) {
    notFound()
  }

  // updateGenerationAction 에 generationId 를 넣어서 새로운 함수 생성
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
        className={'member-data-grid w-full gap-4'}
      >
        <DataInput
          title={'Generation Name'}
          defaultValue={generationData.name}
          name={'name'}
          placeholder={'Generation Name'}
        />
        <DataInput
          title={'Start Date'}
          defaultValue={generationData.startDate}
          name={'startDate'}
          placeholder={'Start Date'}
          type={'date'}
        />
        <DataInput
          title={'End Date'}
          defaultValue={generationData.endDate}
          name={'endDate'}
          placeholder={'End Date'}
          type={'date'}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
