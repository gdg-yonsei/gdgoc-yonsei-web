/**
 * 관리자 기수 범위 표시줄(서버 컴포넌트). 사이드바와 페이지 상단 두 가지 모양이 있다.
 */
import AdminGenerationScopeSelect from '@/app/components/admin/admin-generation-scope-select'
import { cn } from '@/lib/cn'
import { getAdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/lib/i18n'
import {
  type ResolvedAdminGenerationScope,
  serializeAdminGenerationScope,
} from '@/lib/server/admin-generation-scope'

/**
 * 현재 기수 범위와 선택 드롭다운을 보여 준다.
 *
 * @param locale 관리자 화면 언어
 * @param resolvedScope 서버에서 해석한 범위와 선택지(`resolveAdminGenerationScope` 결과)
 * @param variant `sidebar`면 사이드바용 좁은 카드, 기본값은 페이지 상단 카드
 */
export default function AdminGenerationScopeBar({
  locale,
  resolvedScope,
  variant = 'default',
}: {
  locale: Locale
  resolvedScope: ResolvedAdminGenerationScope
  variant?: 'default' | 'sidebar'
}) {
  const t = getAdminMessages(locale)
  const isSidebar = variant === 'sidebar'

  return (
    <div
      className={cn(
        isSidebar
          ? 'border-hairline bg-canvas w-full rounded-lg border p-3'
          : 'border-hairline bg-surface shadow-soft rounded-xl border p-4'
      )}
    >
      {isSidebar ? (
        <div className={'flex flex-col gap-1.5'}>
          {resolvedScope.options.length > 0 ? (
            <AdminGenerationScopeSelect
              allGenerationsLabel={t.allGenerations}
              canAccessAll={resolvedScope.canAccessAll}
              label={t.generation}
              options={resolvedScope.options}
              pendingLabel={t.refreshing}
              selectedValue={serializeAdminGenerationScope(resolvedScope.scope)}
            />
          ) : (
            <div
              className={
                'bg-surface-sunken text-ink-muted type-caption rounded-md px-3 py-2'
              }
            >
              {t.noAccessibleGenerations}
            </div>
          )}
        </div>
      ) : (
        <div
          className={
            'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'
          }
        >
          {resolvedScope.options.length > 0 ? (
            <AdminGenerationScopeSelect
              allGenerationsLabel={t.allGenerations}
              canAccessAll={resolvedScope.canAccessAll}
              label={t.currentGenerationScope}
              options={resolvedScope.options}
              pendingLabel={t.refreshing}
              selectedValue={serializeAdminGenerationScope(resolvedScope.scope)}
            />
          ) : (
            <div
              className={
                'bg-surface-sunken text-ink-muted type-caption rounded-md px-3 py-2'
              }
            >
              {t.noAccessibleGenerations}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
