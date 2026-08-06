'use client'

import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { FormEvent, ReactNode, useActionState, useState } from 'react'

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
        toBilingualValidationMessage(missingBilingualPanels, locale)
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
