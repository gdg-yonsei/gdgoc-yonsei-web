'use client'

import { useActionState, useState, type FormEvent, type ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  getLanguageCompletion,
  parseFieldNames,
  type BilingualLanguage,
} from '@/app/components/admin/bilingual-completion'
import { fillTemplate } from '@/lib/format/text'

const initialState = {
  error: '',
}

interface MissingBilingualPanel {
  fieldLabel: string
  missingLanguages: BilingualLanguage[]
}

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

/** 서버 액션은 오류를 반환하고 성공 시 redirect한다. 양쪽 언어가 필요한 패널은 제출 전에 검사해 서버 왕복을 막는다. */
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
    <form
      action={formAction}
      onSubmit={handleSubmit}
      // React는 검증 오류를 반환한 액션도 정상 종료로 보고 폼을 초기화한다.
      // 성공 시에는 redirect하므로 입력값은 유지해 오류 수정·재제출을 돕는다.
      onReset={(event) => event.preventDefault()}
      className={className}
    >
      {children}
      {errorMessage ? (
        <p className={'m-auto text-red-500'}>{errorMessage}</p>
      ) : (
        ''
      )}
    </form>
  )
}
