import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import GenerationActivityPeriod from '@/app/components/admin/generation-activity-period'
import { notFound } from 'next/navigation'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { auth } from '@/auth'
import DataDeleteButton from '@/app/components/admin/data-delete-button'

/**
 * `generateMetadata` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const { generationId } = await params
  // generation 데이터 가져오기
  const generationData = await getGeneration(Number(generationId))

  return {
    title: `Generation: ${generationData?.name}`,
  }
}

/**
 * `GenerationPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function GenerationPage({
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
  // 사용자 권한 가져오기
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/generations'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Generations</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>Generation: {generationData.name}</div>
        <DataEditLink
          session={session}
          dataType={'generations'}
          href={`/admin/generations/${generationId}/edit`}
        />
        <DataDeleteButton
          session={session}
          dataType={'generations'}
          dataId={generationId}
        />
      </div>
      <div
        className={
          'mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }
      >
        <div className={'member-data-box col-span-1 sm:col-span-2'}>
          <div className={'member-data-title'}>Activity Period</div>
          <GenerationActivityPeriod
            className={'member-data-content flex items-center gap-2'}
            startDate={generationData.startDate}
            endDate={generationData.endDate}
          />
        </div>
        <div className={'col-span-4 flex flex-col gap-2 py-4'}>
          <div className={'member-data-title'}>Parts</div>
          <div
            className={
              'grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }
          >
            {generationData.parts.map((part) => (
              <div key={part.id} className={'member-data-box'}>
                <div className={'member-data-content'}>{part.name}</div>
                <div>Member: {part.usersToParts.length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
