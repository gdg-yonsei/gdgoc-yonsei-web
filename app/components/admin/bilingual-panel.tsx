'use client'

/**
 * 영어·한국어 입력 패널(클라이언트 컴포넌트). 관리자 폼의 모든 이중 언어 필드가 이 패널 안에 들어간다.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { getLanguageCompletion } from '@/app/components/admin/bilingual-completion'
import { cn } from '@/lib/cn'
import { fillTemplate } from '@/lib/format/text'

/**
 * 영어·한국어 입력을 탭(또는 나란히 보기)으로 묶는 패널.
 *
 * - 비활성 탭은 언마운트하지 않고 숨겨 두어, 폼 제출 시 두 언어 값이 모두 전송된다.
 * - `requiredBoth`이면 부모 `<form>`의 입력을 지켜보며 언어별 작성 여부를 표시하고,
 *   제출할 때 빠진 언어 탭으로 전환한다. 제출 자체를 막는 일은 `DataForm`이 한다
 *   (`data-bilingual-*` 속성으로 필드 정보를 넘긴다).
 */
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

  const title =
    selected === 'ko' ? (koTitle ?? t('korean')) : (enTitle ?? t('english'))

  // 부모 <form>은 이 컴포넌트 밖의 DOM이므로 이벤트 리스너로 동기화한다.
  useEffect(() => {
    if (!requiredBoth || !panelRef.current) {
      return
    }

    const formElement = panelRef.current.closest('form')
    if (!(formElement instanceof HTMLFormElement)) {
      return
    }

    const evaluateCompletion = () =>
      enFieldNames.length && koFieldNames.length
        ? getLanguageCompletion(
            new FormData(formElement),
            enFieldNames,
            koFieldNames
          )
        : { en: true, ko: true }

    const syncCompletion = () => {
      const next = evaluateCompletion()
      setCompletion(next)
      setShowValidationMessage((prev) => (prev ? !(next.en && next.ko) : prev))
    }

    const onSubmit = () => {
      const next = evaluateCompletion()
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
  }, [requiredBoth, enFieldNames, koFieldNames, splitView])

  const hasMissingLanguage = requiredBoth && (!completion.en || !completion.ko)

  const missingLanguageMessage = hasMissingLanguage
    ? fillTemplate(t('bilingualFillVersion'), {
        label: fieldLabel ?? t('bilingualThisField'),
        languages: [
          !completion.en ? t('english') : null,
          !completion.ko ? t('korean') : null,
        ]
          .filter(Boolean)
          .join(', '),
      })
    : ''

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
