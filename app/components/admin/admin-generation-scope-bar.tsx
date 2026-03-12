import AdminGenerationScopeSelect from '@/app/components/admin/admin-generation-scope-select'
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
      className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm ${
        isSidebar ? 'w-full' : ''
      }`}
    >
      {isSidebar ? (
        <div className={'flex flex-col gap-2'}>
          <div className={'text-sm font-semibold text-neutral-700'}>
            {t.generation}
          </div>
          {resolvedScope.options.length > 0 ? (
            <AdminGenerationScopeSelect
              allGenerationsLabel={t.allGenerations}
              canAccessAll={resolvedScope.canAccessAll}
              label={t.generation}
              options={resolvedScope.options}
              pendingLabel={t.refreshing}
              selectedValue={serializeAdminGenerationScope(resolvedScope.scope)}
              showLabel={false}
            />
          ) : (
            <div className={'rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600'}>
              {t.noAccessibleGenerations}
            </div>
          )}
        </div>
      ) : (
        <div className={'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'}>
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
            <div className={'rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600'}>
              {t.noAccessibleGenerations}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
