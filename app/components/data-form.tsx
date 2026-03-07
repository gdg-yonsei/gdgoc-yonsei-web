'use client'

import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  FormEvent,
  ReactNode,
  startTransition,
  useActionState,
  useState,
} from 'react'

const initialState = {
  error: '',
}

type MissingLanguage = 'en' | 'ko'

interface MissingBilingualPanel {
  fieldLabel: string
  missingLanguages: MissingLanguage[]
}

function parseFieldNames(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

function isFilledValue(value: FormDataEntryValue | null): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  if (value instanceof File) {
    return value.size > 0
  }
  return false
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

    const missingLanguages: MissingLanguage[] = []

    if (
      !enFieldNames.every((fieldName) => isFilledValue(formData.get(fieldName)))
    ) {
      missingLanguages.push('en')
    }

    if (
      !koFieldNames.every((fieldName) => isFilledValue(formData.get(fieldName)))
    ) {
      missingLanguages.push('ko')
    }

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

function toBilingualValidationMessage(
  missingPanels: MissingBilingualPanel[],
  locale: string
): string {
  const isKorean = locale === 'ko'
  const detailMessages = missingPanels.map((panel) => {
    const languages = panel.missingLanguages.map((language) => {
      if (isKorean) {
        return language === 'en' ? '영어' : '한국어'
      }
      return language === 'en' ? 'English' : 'Korean'
    })
    return `${panel.fieldLabel} (${languages.join(', ')})`
  })

  if (isKorean) {
    return `한글/영어 버전을 모두 작성해 주세요: ${detailMessages.join(', ')}`
  }
  return `Please complete both Korean and English versions: ${detailMessages.join(', ')}`
}

/**
 * Data Form
 * @param action - form action
 * @param children - React Children
 * @param className - classname of form
 * @constructor
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
  const { locale } = useAdminI18n()

  /**
   * `handleSubmit` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(`event`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const missingBilingualPanels = getMissingBilingualPanels(
      formElement,
      formData
    )

    if (missingBilingualPanels.length > 0) {
      setClientError(
        toBilingualValidationMessage(missingBilingualPanels, locale)
      )
      return
    }

    setClientError('')
    startTransition(() => formAction(formData))
  }

  const errorMessage = clientError || state.error

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      {errorMessage ? (
        <p className={'m-auto text-red-500'}>{errorMessage}</p>
      ) : (
        ''
      )}
    </form>
  )
}
