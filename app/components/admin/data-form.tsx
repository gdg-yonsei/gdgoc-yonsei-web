'use client'

/**
 * 관리자 생성·수정·삭제 폼의 공용 래퍼(클라이언트 컴포넌트).
 *
 * 모든 관리자 폼 Server Action은 `AdminFormState`(`{ error }`)를 돌려주고, 이 컴포넌트가
 * 그 오류를 표시한다. 성공하면 액션이 redirect하므로 여기서 따로 처리하지 않는다.
 */
import { useActionState, useState, type FormEvent, type ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  getLanguageCompletion,
  parseFieldNames,
  type BilingualLanguage,
} from '@/app/components/admin/bilingual-completion'
import { fillTemplate } from '@/lib/format/text'

/** `useActionState` 초기 상태(오류 없음). */
const initialState = {
  error: '',
}

/** 제출을 막아야 할, 한쪽 언어가 빠진 패널. */
interface MissingBilingualPanel {
  fieldLabel: string
  missingLanguages: BilingualLanguage[]
}

/** 폼 안에서 양쪽 언어가 필수인 패널 중 빠진 언어가 있는 패널을 찾는다. */
function getMissingBilingualPanels(
  formElement: HTMLFormElement,
  formData: FormData
): MissingBilingualPanel[] {
  const panelElements = Array.from(
    formElement.querySelectorAll<HTMLElement>(
      '[data-bilingual-required="true"]'
    )
  )

  return panelElements.flatMap((panelElement) => {
    const enFieldNames = parseFieldNames(panelElement.dataset.bilingualEnFields)
    const koFieldNames = parseFieldNames(panelElement.dataset.bilingualKoFields)
    if (!enFieldNames.length || !koFieldNames.length) {
      return []
    }

    const completion = getLanguageCompletion(
      formData,
      enFieldNames,
      koFieldNames
    )
    const missingLanguages = (['en', 'ko'] as const).filter(
      (language) => !completion[language]
    )
    if (!missingLanguages.length) {
      return []
    }

    return [
      {
        fieldLabel:
          panelElement.dataset.bilingualFieldLabel ??
          panelElement.dataset.bilingualEnFields ??
          'Field',
        missingLanguages,
      },
    ]
  })
}

/**
 * 관리자 생성·수정 폼 공용 래퍼.
 *
 * Server Action을 `useActionState`로 연결하고, 서버가 돌려준 오류 문구를 폼 아래에
 * 보여 준다. 제출 직전에는 양쪽 언어가 필수인 패널을 검사해 빠진 언어가 있으면
 * 서버 왕복 없이 제출을 막는다.
 */
export default function DataForm({
  action,
  children,
  className,
}: {
  children: ReactNode
  action: (
    state: {
      error: string
    },
    formData: FormData
  ) => { error: string } | Promise<{ error: string }>
  className?: string
}) {
  const [state, formAction] = useActionState(action, initialState)
  const [clientError, setClientError] = useState('')
  const { t } = useAdminI18n()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const missingBilingualPanels = getMissingBilingualPanels(
      formElement,
      formData
    )

    if (missingBilingualPanels.length > 0) {
      event.preventDefault()
      setClientError(
        fillTemplate(t('bilingualCompleteBoth'), {
          details: missingBilingualPanels
            .map(
              (panel) =>
                `${panel.fieldLabel} (${panel.missingLanguages
                  .map((language) =>
                    t(language === 'en' ? 'languageNameEn' : 'languageNameKo')
                  )
                  .join(', ')})`
            )
            .join(', '),
        })
      )
      return
    }

    setClientError('')
  }

  const errorMessage = clientError || state.error

  return (
    <form action={formAction} onSubmit={handleSubmit} className={className}>
      {children}
      {errorMessage ? (
        <p className={'m-auto text-red-500'}>{errorMessage}</p>
      ) : (
        ''
      )}
    </form>
  )
}
