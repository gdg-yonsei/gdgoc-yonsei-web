'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  MAX_PROJECT_TAGS,
  MAX_TAG_LENGTH,
  dedupeTags,
} from '@/lib/validations/project-tags'

/** Chip input for a project's tech stack; submits a JSON `tags` field. */
export default function TagsInput({
  defaultValue,
  suggestions,
}: {
  defaultValue: string[]
  suggestions: string[]
}) {
  const { t } = useAdminI18n()
  const id = useId()
  const [tags, setTags] = useState(() =>
    dedupeTags(defaultValue).slice(0, MAX_PROJECT_TAGS)
  )
  const [draft, setDraft] = useState('')
  const full = tags.length >= MAX_PROJECT_TAGS
  const chosen = new Set(tags.map((tag) => tag.toLowerCase()))

  function add(raw: string) {
    setDraft('')
    const incoming = raw
      .split(',')
      .map((part) => part.trim().slice(0, MAX_TAG_LENGTH))
      .filter(Boolean)
    if (incoming.length === 0) return
    setTags((current) =>
      dedupeTags([...current, ...incoming]).slice(0, MAX_PROJECT_TAGS)
    )
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(draft)
    } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      setTags((current) => current.slice(0, -1))
    }
  }

  return (
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <label htmlFor={id} className={'admin-field-label'}>
        {t('tags')}
      </label>
      <input hidden readOnly name={'tags'} value={JSON.stringify(tags)} />
      {tags.length > 0 && (
        <ul aria-label={t('tagsSelected')} className={'flex flex-wrap gap-2'}>
          {tags.map((tag) => (
            <li
              key={tag.toLowerCase()}
              className={
                'border-hairline bg-surface text-ink inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm'
              }
            >
              {tag}
              <button
                type={'button'}
                aria-label={`${t('removeTag')} ${tag}`}
                onClick={() =>
                  setTags((current) => current.filter((item) => item !== tag))
                }
                className={'hover:bg-canvas rounded-full p-1'}
              >
                <XMarkIcon aria-hidden={'true'} className={'size-3.5'} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        value={draft}
        list={`${id}-suggestions`}
        disabled={full}
        maxLength={MAX_TAG_LENGTH}
        autoComplete={'off'}
        placeholder={t('tagsPlaceholder')}
        aria-describedby={`${id}-hint`}
        onChange={(event) => {
          const { value } = event.target
          if (value.includes(',')) add(value)
          else setDraft(value)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        className={'admin-input'}
      />
      <datalist id={`${id}-suggestions`}>
        {suggestions
          .filter((suggestion) => !chosen.has(suggestion.toLowerCase()))
          .map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
      </datalist>
      <p id={`${id}-hint`} className={'text-xs opacity-70'}>
        {full ? t('tagsLimit') : t('tagsHint')}
      </p>
    </div>
  )
}
