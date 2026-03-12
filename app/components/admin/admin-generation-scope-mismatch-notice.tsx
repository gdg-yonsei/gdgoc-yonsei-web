import AdminGenerationScopeSwitchButton from '@/app/components/admin/admin-generation-scope-switch-button'
import { getAdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'
import {
  type AdminGenerationOption,
  type AdminGenerationScope,
} from '@/lib/server/admin-generation-scope'

export default function AdminGenerationScopeMismatchNotice({
  actualGeneration,
  canSwitch,
  currentScope,
  locale,
}: {
  actualGeneration: AdminGenerationOption
  canSwitch: boolean
  currentScope: AdminGenerationScope | null
  locale: Locale
}) {
  if (
    currentScope?.kind !== 'generation' ||
    currentScope.generationId === actualGeneration.id
  ) {
    return null
  }

  const t = getAdminMessages(locale)

  return (
    <div
      className={
        'mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950'
      }
    >
      <div className={'flex flex-col gap-1'}>
        <div className={'font-semibold'}>{t.itemGenerationMismatch}</div>
        <div>{t.itemGenerationMismatchHint}</div>
        <div>
          {t.itemGeneration}: <span className={'font-semibold'}>{actualGeneration.name}</span>
        </div>
      </div>
      {canSwitch && (
        <div>
          <AdminGenerationScopeSwitchButton
            scopeValue={String(actualGeneration.id)}
          >
            {t.switchToItemGeneration}
          </AdminGenerationScopeSwitchButton>
        </div>
      )}
    </div>
  )
}
