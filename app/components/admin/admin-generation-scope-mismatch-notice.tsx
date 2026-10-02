/**
 * 편집/상세 화면에서 "선택한 기수 범위"와 "항목의 실제 기수"가 다를 때 띄우는 경고(서버 컴포넌트).
 *
 * 다른 기수의 항목을 실수로 고치는 일을 막기 위해 part·project·session 화면이 함께 쓴다.
 */
import AdminGenerationScopeSwitchButton from '@/app/components/admin/admin-generation-scope-switch-button'
import { getAdminMessages } from '@/lib/admin-i18n'
import { Locale } from '@/lib/i18n'
import {
  type AdminGenerationOption,
  type AdminGenerationScope,
} from '@/lib/server/admin-generation-scope'

/**
 * 범위가 특정 기수로 좁혀져 있고 항목의 기수와 다를 때만 경고를 렌더링한다.
 *
 * @param actualGeneration 항목이 속한 기수
 * @param canSwitch 사용자가 그 기수로 전환할 권한이 있는지(`canSwitchToGeneration`)
 * @param currentScope 현재 선택된 범위(없으면 경고하지 않음)
 * @param locale 관리자 화면 언어
 */
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
