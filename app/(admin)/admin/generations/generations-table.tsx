import { getGenerations } from '@/lib/fetcher/admin/get-generations'
import Link from 'next/link'
import GenerationActivityPeriod from '@/app/components/admin/generation-activity-period'

/**
 * Generations 를 보여주는 Table 컴포넌트
 * @constructor
 */
export default async function GenerationsTable() {
  // generations 데이터 가져오기
  const generationsData = await getGenerations()

  return (
    <div className={'member-data-grid w-full gap-2'}>
      {generationsData.map((generation) => (
        <Link
          href={`/admin/generations/${generation.id}`}
          key={generation.id}
          className={
            'flex flex-col items-center justify-center gap-2 rounded-xl bg-white p-4'
          }
        >
          <div className={'text-xl font-bold'}>
            Generation: {generation.name}
          </div>
          <div>
            <div className={'text-sm text-neutral-600'}>Activity Period</div>
            <GenerationActivityPeriod
              startDate={generation.startDate}
              endDate={generation.endDate}
            />
          </div>
        </Link>
      ))}
    </div>
  )
}
