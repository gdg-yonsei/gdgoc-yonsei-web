'use client'

import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/cn'

export default function BilingualPanel({
  enTitle,
  koTitle,
  enContent,
  koContent,
  className,
  requiredBoth = false,
  enFieldNames = [],
  koFieldNames = [],
  fieldLabel,
}: {
  enTitle?: string
  koTitle?: string
  enContent: ReactNode
  koContent: ReactNode
  className?: string
  requiredBoth?: boolean
  enFieldNames?: string[]
  koFieldNames?: string[]
  fieldLabel?: string
}) {
  const { locale, t } = useAdminI18n()
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [selected, setSelected] = useState<'en' | 'ko'>(
    locale === 'ko' ? 'ko' : 'en'
  )
  const [splitView, setSplitView] = useState(false)
  const [completion, setCompletion] = useState<{ en: boolean; ko: boolean }>({
    en: true,
    ko: true,
  })
  const [showValidationMessage, setShowValidationMessage] = useState(false)

  const title = useMemo(() => {
    if (selected === 'ko') {
      return koTitle ?? t('korean')
    }
    return enTitle ?? t('english')
  }, [selected, enTitle, koTitle, t])

  const evaluateCompletion = useCallback(
    (formElement: HTMLFormElement) => {
      if (!requiredBoth || !enFieldNames.length || !koFieldNames.length) {
        return { en: true, ko: true }
      }

      const formData = new FormData(formElement)
      const isFilled = (name: string) => {
        const value = formData.get(name)
        if (typeof value === 'string') {
          return value.trim().length > 0
        }
        if (value instanceof File) {
          return value.size > 0
        }
        return false
      }

      return {
        en: enFieldNames.every(isFilled),
        ko: koFieldNames.every(isFilled),
      }
    },
    [requiredBoth, enFieldNames, koFieldNames]
  )

  useEffect(() => {
    if (!requiredBoth || !panelRef.current) {
      return
    }

    const formElement = panelRef.current.closest('form')
    if (!(formElement instanceof HTMLFormElement)) {
      return
    }

    const syncCompletion = () => {
      const next = evaluateCompletion(formElement)
      setCompletion(next)
      setShowValidationMessage((prev) => (prev ? !(next.en && next.ko) : prev))
    }

    const onSubmit = () => {
      const next = evaluateCompletion(formElement)
      const hasMissingLanguage = !next.en || !next.ko
      setCompletion(next)
      setShowValidationMessage(hasMissingLanguage)

      if (hasMissingLanguage && !splitView) {
        setSelected(!next.en ? 'en' : 'ko')
      }
    }

    syncCompletion()
    formElement.addEventListener('input', syncCompletion)
    formElement.addEventListener('change', syncCompletion)
    formElement.addEventListener('submit', onSubmit)

    return () => {
      formElement.removeEventListener('input', syncCompletion)
      formElement.removeEventListener('change', syncCompletion)
      formElement.removeEventListener('submit', onSubmit)
    }
  }, [evaluateCompletion, requiredBoth, splitView])

  const hasMissingLanguage = requiredBoth && (!completion.en || !completion.ko)

  const missingLanguageMessage = useMemo(() => {
    if (!hasMissingLanguage) {
      return ''
    }
    const missingLanguages = [
      !completion.en ? t('english') : null,
      !completion.ko ? t('korean') : null,
    ].filter((value): value is string => Boolean(value))
    const label = fieldLabel ?? (locale === 'ko' ? '이 항목' : 'This field')

    if (locale === 'ko') {
      return `${label}: ${missingLanguages.join(', ')} 버전을 작성해 주세요.`
    }
    return `${label}: Please fill the ${missingLanguages.join(', ')} version.`
  }, [completion.en, completion.ko, fieldLabel, hasMissingLanguage, locale, t])

  const statusDoneText = t('written')
  const statusMissingText = t('notWritten')

  return (
    <div
      ref={panelRef}
      className={className}
      data-bilingual-required={
        requiredBoth && enFieldNames.length && koFieldNames.length
          ? 'true'
          : undefined
      }
      data-bilingual-en-fields={enFieldNames.join(',')}
      data-bilingual-ko-fields={koFieldNames.join(',')}
      data-bilingual-field-label={fieldLabel}
    >
      <div className={'flex flex-wrap items-center gap-2 pb-2'}>
        <div className={'admin-field-label'} id={`${panelId}-lang`}>
          {t('language')}
        </div>
        {/* 선택 상태가 색으로만 전달되지 않도록 tablist/tab 시맨틱을 씁니다.
            비활성 pane은 언마운트하지 않고 `hidden`으로 남겨야 FormData에
            두 언어가 모두 포함됩니다. */}
        <div
          role={'tablist'}
          aria-labelledby={`${panelId}-lang`}
          className={'flex flex-wrap items-center gap-2'}
        >
          {(['en', 'ko'] as const).map((lang) => {
            const isSelected = selected === lang
            const isComplete = completion[lang]
            return (
              <button
                key={lang}
                type={'button'}
                role={'tab'}
                aria-selected={isSelected}
                className={cn(
                  'type-body-sm inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 py-1 transition-colors',
                  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
                  isSelected
                    ? 'border-primary bg-primary text-on-primary'
                    : isComplete || !requiredBoth
                      ? 'border-hairline bg-surface text-ink hover:bg-canvas'
                      : 'border-danger/40 bg-danger-soft text-danger'
                )}
                onClick={() => setSelected(lang)}
              >
                {lang === 'en' ? t('english') : t('korean')}
                {requiredBoth && (
                  <span
                    className={cn(
                      'type-eyebrow rounded-full px-2 py-0.5',
                      isSelected
                        ? 'bg-on-primary/20 text-on-primary'
                        : isComplete
                          ? 'bg-success-soft text-success'
                          : 'bg-danger-soft text-danger'
                    )}
                  >
                    {isComplete ? statusDoneText : statusMissingText}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <button
          type={'button'}
          className={'admin-btn-ghost type-body-sm ml-auto min-h-9'}
          onClick={() => setSplitView((prev) => !prev)}
        >
          {splitView ? t('singleView') : t('splitView')}
        </button>
        {showValidationMessage && hasMissingLanguage && (
          <p
            role={'alert'}
            className={'type-caption text-danger w-full font-semibold'}
          >
            {missingLanguageMessage}
          </p>
        )}
      </div>

      {!splitView && (
        <div className={'admin-card'}>
          <div className={'admin-field-label pb-2'}>{title}</div>
          <div className={selected === 'en' ? '' : 'hidden'}>{enContent}</div>
          <div className={selected === 'ko' ? '' : 'hidden'}>{koContent}</div>
        </div>
      )}

      {splitView && (
        <div className={'grid grid-cols-1 gap-2 lg:grid-cols-2'}>
          <div className={'admin-card'}>
            <div className={'admin-field-label pb-2'}>
              {enTitle ?? t('english')}
            </div>
            {enContent}
          </div>
          <div className={'admin-card'}>
            <div className={'admin-field-label pb-2'}>
              {koTitle ?? t('korean')}
            </div>
            {koContent}
          </div>
        </div>
      )}
    </div>
  )
}
