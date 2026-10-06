'use client'

import AdminDataTable, {
  type AdminColumn,
} from '@/app/components/admin/data-table'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { GenerationGroup } from '@/app/(admin)/admin/_lib/admin-table-client'

/** 전체 기수 범위는 기수 제목으로 표를 나누고, 특정 기수는 제목 없이 표 하나를 표시한다. */
export default function GenerationGroupedTables<T>({
  groups,
  showGenerationHeadings,
  captionLabel,
  columns,
  getKey,
  getHref,
}: {
  groups: GenerationGroup<T>[]

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
            caption={`${captionLabel}: ${group.generationName}`}
            getKey={getKey}
            getHref={getHref}
            columns={columns}
          />
        </div>
      ))}
    </div>
  )
}
