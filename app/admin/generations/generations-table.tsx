import { getGenerations } from '@/lib/fetcher/get-generations'
import Link from 'next/link'
import GenerationActivityPeriod from '@/app/components/admin/generation-activity-period'

export default async function GenerationsTable() {
  const generationsData = await getGenerations()

  return (
    <div className={'w-full member-data-grid gap-2'}>
      {generationsData.map((generation) => (
        <Link
          href={`/admin/generations/${generation.id}`}
          key={generation.id}
          className={
            'p-4 rounded-xl bg-white flex flex-col items-center justify-center gap-2'
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
