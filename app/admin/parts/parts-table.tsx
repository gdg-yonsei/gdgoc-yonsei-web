import { getParts } from '@/lib/fetcher/get-parts'
import Link from 'next/link'

export default async function PartsTable() {
  const partsData = await getParts()

  return (
    <div className={'w-full flex flex-col gap-2'}>
      {partsData.map((generation) => (
        <div key={generation.id}>
          <div className={'border-b-2'}>{generation.name}</div>
          <div className={'member-data-grid w-full gap-2 pt-2'}>
            {generation.parts.map((part) => (
              <Link
                href={`/admin/parts/${part.id}`}
                key={part.id}
                className={'p-4 rounded-xl bg-white flex flex-col'}
              >
                <div className={'text-xl font-bold pb-1'}>{part.name}</div>
                <div className={'text-sm'}>{part.description}</div>
                <div className={'text-sm'}>
                  Member: {part.usersToParts.length}
                </div>
                <div className={'text-sm'}>{generation.name}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
