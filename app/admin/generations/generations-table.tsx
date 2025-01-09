import { getGenerations } from '@/lib/fetcher/get-generations'
import Link from 'next/link'

export default async function GenerationsTable() {
  const generationsData = await getGenerations()

  return (
    <div className={'w-full grid grid-cols-4 gap-2'}>
      {generationsData.map((generation) => (
        <Link
          href={`/admin/generations/${generation.id}`}
          key={generation.id}
          className={'p-2 rounded-xl bg-white'}
        >
          <div className={'text-xl font-bold'}>
            Generation: {generation.name}
          </div>
          <div>
            <div className={'text-sm text-neutral-600'}>Activity Period</div>
            <div className={'flex items-center gap-2 text-sm'}>
              <div>
                {new Intl.DateTimeFormat('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(new Date(generation.startDate))}
              </div>
              <div>-</div>
              <div>
                {generation.endDate
                  ? new Intl.DateTimeFormat('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }).format(new Date(generation.endDate))
                  : ''}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
