'use client'

import AdminDataTable, {
  type AdminColumn,
} from '@/app/components/admin/data-table'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { GenerationGroup } from '@/app/(admin)/admin/_lib/admin-table-client'

/**
 * 기수별로 묶은 관리자 목록 표.
 *
 * "전체 기수" 범위에서는 기수마다 제목을 붙여 여러 표를 보여 주고, 특정 기수
 * 범위에서는 제목 없이 표 하나만 보인다. 결과가 없으면 빈 상태 안내를 보여 준다.
 */
export default function GenerationGroupedTables<T>({
  groups,
  showGenerationHeadings,
  captionLabel,
  columns,
  getKey,
  getHref,
}: {
  groups: GenerationGroup<T>[]
  /** 기수 제목을 보일지. 보통 `scope?.kind === 'all'`. */
  showGenerationHeadings: boolean
  /** 스크린리더용 표 설명 앞부분(예: "Members"). 뒤에 기수 이름이 붙는다. */
  captionLabel: string
  columns: AdminColumn<T>[]
  getKey: (item: T) => string
  getHref: (item: T) => string
}) {
  const { messages: t } = useAdminI18n()

  if (groups.length === 0) {
    return (
      <AdminEmptyState
        title={t.noScopedResults}
        description={t.noScopedResultsHint}
      />
    )
  }

  return (
    <div className={'flex w-full flex-col gap-6'}>
      {groups.map((group) => (
        <div key={group.generationName} className={'flex flex-col gap-2'}>
          {showGenerationHeadings && (
            <h2 className={'admin-field-label'}>
              {t.generation}: {group.generationName}
            </h2>
          )}
          <AdminDataTable
            items={group.items}
            caption={`${captionLabel} — ${group.generationName}`}
            getKey={getKey}
            getHref={getHref}
            columns={columns}
          />
        </div>
      ))}
    </div>
  )
}
