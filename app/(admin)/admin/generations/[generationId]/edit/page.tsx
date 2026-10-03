/**
 * 기수 수정 화면(`/admin/generations/{id}/edit`). 권한은 레이아웃이 확인하고, 항목이 없으면 404.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import { notFound } from 'next/navigation'
import { updateGenerationAction } from '@/app/(admin)/admin/generations/[generationId]/edit/actions'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import DataForm from '@/app/components/admin/data-form'
import { Metadata } from 'next'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { connection } from 'next/server'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Edit Generation',
}

/** 기존 값을 채운 기수 수정 폼. */
export default async function EditGenerationPage({
  params,
}: PageProps<'/admin/generations/[generationId]/edit'>) {
  await connection()
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
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
        <p className={'text-lg'}>
          {t.generation}: {generationData.name}
        </p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        {t.edit} {t.generation}: {generationData.name}
      </div>
      <DataForm
        action={updateGenerationActionWithGenerationId}
        className={'admin-form-grid w-full gap-4'}
      >
        <DataInput
          title={t.generation}
          defaultValue={generationData.name}
          name={'name'}
          placeholder={'Generation Name'}
        />
        <DataInput
          title={t.startTime}
          defaultValue={generationData.startDate}
          name={'startDate'}
          placeholder={'Start Date'}
          type={'date'}
        />
        <DataInput
          title={t.endTime}
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
