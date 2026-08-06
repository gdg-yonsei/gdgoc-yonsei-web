'use client'

import { useEffect, useRef, useState } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { cn } from '@/lib/cn'

/**
 * Data Multiple Select Input Component
 *
 * input 데이터는 리스트 형태를 JSON 문자열로 변환하여 input 에 저장
 *
 * 이후 활용할 때 JSON.parse 를 통해 데이터를 추출하여 사용 필요
 * @param data - data list
 * @param name - input name
 * @param title - input title
 * @param defaultValue - default value
 * @constructor
 */
export default function DataSelectMultipleInput({
  data,
  name,
  title,
  defaultValue,
}: {
  data: {
    name: string
    value: string
    generation?: string | null
    part?: string | null
  }[]
  name: string
  title: string
  defaultValue: string[]
}) {
  const { t } = useAdminI18n()
  const [search, setSearch] = useState('')
  // input ref
  const inputRef = useRef<HTMLInputElement>(null)
  // multiple value state
  const [value, setValue] = useState(defaultValue)

  // handle click event
  function handleClick(data: string) {
    // if value includes data, remove data from value
    if (value.includes(data)) {
      setValue(value.filter((v) => v !== data))
    } else {
      // if value does not include data, add data to value
      setValue([...value, data])
    }
  }

  useEffect(() => {
    // if input ref exists, set value to input
    if (inputRef.current) {
      inputRef.current.value = JSON.stringify(value)
    }
  }, [value])

  const filteredData = data.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <div className={'admin-field-label'}>{title}</div>
      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="admin-input mb-2 max-w-xs"
      />
      <input name={name} hidden={true} ref={inputRef} />
      <div className={'admin-form-grid gap-2'}>
        {filteredData.map((d, i) => (
          <button
            type={'button'}
            key={i}
            aria-pressed={value.includes(d.value)}
            className={cn(
              'admin-btn h-auto flex-col items-start gap-0.5 py-2 text-left',
              value.includes(d.value)
                ? 'bg-primary text-on-primary'
                : 'border-hairline bg-surface text-ink hover:bg-canvas border'
            )}
            onClick={() => handleClick(d.value)}
          >
            {d.generation || d.part ? (
              <div
                className={cn(
                  'type-eyebrow text-left font-normal',
                  value.includes(d.value)
                    ? 'text-on-primary/75'
                    : 'text-ink-muted'
                )}
              >
                {d.generation ? `${d.generation} ` : ''}
                {d.part ? `· ${d.part}` : ''}
              </div>
            ) : null}
            <div className="text-left">{d.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
