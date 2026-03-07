'use client'

import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

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

  const statusDoneText = locale === 'ko' ? '작성됨' : 'Done'
  const statusMissingText = locale === 'ko' ? '미작성' : 'Missing'

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
        <div className={'member-data-title'}>{t('language')}</div>
        <button
          type={'button'}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
            selected === 'en'
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : completion.en || !requiredBoth
                ? 'border-emerald-500 bg-white text-emerald-700'
                : 'border-red-400 bg-red-50 text-red-700'
          }`}
          onClick={() => setSelected('en')}
        >
          {t('english')}
          {requiredBoth && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                selected === 'en'
                  ? 'bg-white/20 text-white'
                  : completion.en
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {completion.en ? statusDoneText : statusMissingText}
            </span>
          )}
        </button>
        <button
          type={'button'}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
            selected === 'ko'
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : completion.ko || !requiredBoth
                ? 'border-emerald-500 bg-white text-emerald-700'
                : 'border-red-400 bg-red-50 text-red-700'
          }`}
          onClick={() => setSelected('ko')}
        >
          {t('korean')}
          {requiredBoth && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                selected === 'ko'
                  ? 'bg-white/20 text-white'
                  : completion.ko
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {completion.ko ? statusDoneText : statusMissingText}
            </span>
          )}
        </button>
        <button
          type={'button'}
          className={'ml-auto rounded-full border px-3 py-1 text-sm'}
          onClick={() => setSplitView((prev) => !prev)}
        >
          {splitView ? t('singleView') : t('splitView')}
        </button>
        {showValidationMessage && hasMissingLanguage && (
          <p className={'w-full text-xs font-semibold text-red-600'}>
            {missingLanguageMessage}
          </p>
        )}
      </div>

      {!splitView && (
        <div className={'rounded-xl bg-white p-2'}>
          <div className={'member-data-title pb-2'}>{title}</div>
          <div className={selected === 'en' ? '' : 'hidden'}>{enContent}</div>
          <div className={selected === 'ko' ? '' : 'hidden'}>{koContent}</div>
        </div>
      )}

      {splitView && (
        <div className={'grid grid-cols-1 gap-2 lg:grid-cols-2'}>
          <div className={'rounded-xl bg-white p-2'}>
            <div className={'member-data-title pb-2'}>
              {enTitle ?? t('english')}
            </div>
            {enContent}
          </div>
          <div className={'rounded-xl bg-white p-2'}>
            <div className={'member-data-title pb-2'}>
              {koTitle ?? t('korean')}
            </div>
            {koContent}
          </div>
        </div>
      )}
    </div>
  )
}
