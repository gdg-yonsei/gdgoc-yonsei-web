import AdminGenerationScopeSwitchButton from '@/app/components/admin/admin-generation-scope-switch-button'
import { getAdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/lib/i18n'
import {
  type AdminGenerationOption,
  type AdminGenerationScope,
} from '@/lib/server/admin-generation-scope'

/** 현재 범위가 특정 기수이고 항목의 기수와 다를 때만 경고해, 다른 기수를 실수로 수정하지 않게 한다. */
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
        'border-warning/30 bg-warning-soft text-warning type-body-sm mb-4 flex flex-col gap-3 rounded-xl border p-4'
      }
    >
      <div className={'flex flex-col gap-1'}>
        <div className={'font-semibold'}>{t.itemGenerationMismatch}</div>
        <div>{t.itemGenerationMismatchHint}</div>
        <div>
          {t.itemGeneration}:{' '}
          <span className={'font-semibold'}>{actualGeneration.name}</span>
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
