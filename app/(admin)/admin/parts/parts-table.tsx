import { getParts } from '@/lib/fetcher/get-parts'
import Link from 'next/link'

/**
 * 파트 정보 표시 테이블
 * @constructor
 */
export default async function PartsTable() {
  // 파트 데이터 가져오기
  const partsData = await getParts()

  return (
    <div className={'w-full flex flex-col gap-2'}>
      {partsData.map((generation) => (
        <div key={generation.id}>
          <div
            className={'border-b-2 text-sm text-neutral-600 border-neutral-300'}
          >
            Generation: {generation.name}
          </div>
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
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
