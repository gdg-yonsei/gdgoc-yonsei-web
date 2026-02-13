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

/**
 * `EditGenerationPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
