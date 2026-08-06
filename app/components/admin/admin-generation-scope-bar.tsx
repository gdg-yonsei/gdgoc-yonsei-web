import AdminGenerationScopeSelect from '@/app/components/admin/admin-generation-scope-select'
import { cn } from '@/lib/cn'
import { getAdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'
import {
  type ResolvedAdminGenerationScope,
  serializeAdminGenerationScope,
} from '@/lib/server/admin-generation-scope'

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
