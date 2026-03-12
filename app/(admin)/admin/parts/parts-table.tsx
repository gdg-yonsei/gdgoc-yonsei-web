import {
  getParts,
  type AdminPartListItem,
} from '@/lib/server/fetcher/admin/get-parts'
import Link from 'next/link'
import { type AdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getAdminLocale, getAdminMessages, localizeAdminHref } from '@/lib/admin-i18n/server'

/**
 * 파트 정보 표시 테이블
 * @constructor
 */
function groupPartsByGeneration(partsData: AdminPartListItem[]) {
  return Object.values(
    partsData.reduce<Record<string, { generationName: string; items: AdminPartListItem[] }>>(
      (groups, part) => {
        const key = String(part.generationId ?? 'none')
        if (!groups[key]) {
          groups[key] = {
            generationName: part.generationName ?? 'Unknown',
            items: [],
          }
        }

        groups[key].items.push(part)
        return groups
      },
      {}
    )
  )
}

export default async function PartsTable({
  scope,
}: {
  scope: AdminGenerationScope | null
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  // 파트 데이터 가져오기
  const partsData = await getParts(scope)

  if (partsData.length === 0) {
    return (
      <div className={'rounded-2xl bg-white p-6 text-neutral-700'}>
        <div className={'font-semibold'}>{t.noScopedResults}</div>
        <div className={'pt-1 text-sm text-neutral-500'}>
          {t.noScopedResultsHint}
        </div>
      </div>
    )
  }

  const groupedParts = groupPartsByGeneration(partsData)

  return (
    <div className={'flex w-full flex-col gap-2'}>
      {groupedParts.map((group) => (
        <div key={group.generationName}>
          {scope?.kind === 'all' && (
            <div
              className={'border-b-2 border-neutral-300 text-sm text-neutral-600'}
            >
              {t.generation}: {group.generationName}
            </div>
          )}
          <div className={'member-data-grid w-full gap-2 pt-2'}>
            {group.items.map((part) => (
              <Link
                href={localizeAdminHref(`/admin/parts/${part.id}`, locale)}
                key={part.id}
                className={'flex flex-col rounded-xl bg-white p-4'}
              >
                <div className={'pb-1 text-xl font-bold'}>{part.name}</div>
                <div className={'text-sm'}>{part.description}</div>
                <div className={'text-sm'}>
                  {t.member}: {part.memberCount}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
