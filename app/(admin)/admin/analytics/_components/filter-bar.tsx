'use client'

/**
 * 모든 탭 위에 한 줄로 놓이는 필터. 값은 URL 쿼리에만 저장해 링크로 공유한다.
 * transition 안에서 replace하면 새 데이터가 올 때까지 이전 화면이 유지된다(로딩 화면으로 깜빡이지 않는다).
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import { CHANNELS } from '@/lib/analytics/constants'
import { CONTENT_GROUPS } from '@/lib/analytics/content-groups'
import {
  DEFAULT_ANALYTICS_FILTER,
  DEVICE_TYPES,
  RANGE_PRESETS,
  analyticsFilterToSearchParams,
  parseAnalyticsFilter,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'

const RANGE_LABELS: Record<(typeof RANGE_PRESETS)[number], AdminMessageKey> = {
  today: 'analyticsRangeToday',
  yesterday: 'analyticsRangeYesterday',
  '7d': 'analyticsRange7d',
  '28d': 'analyticsRange28d',
  '90d': 'analyticsRange90d',
  '12m': 'analyticsRange12m',
  custom: 'analyticsRangeCustom',
}

// analyticsFilterToSearchParams가 쓰는 쿼리 키. 이 밖의 키는 다른 화면 상태라 필터 변경과 무관하게 유지한다.
const FILTER_KEYS = new Set([
  'range',
  'from',
  'to',
  'compare',
  'channel',
  'device',
  'country',
  'locale',
  'visitor',
  'group',
  'path',
  'internal',
])

function Select({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label htmlFor={id} className={'flex min-w-36 flex-col gap-1'}>
      <span className={'admin-field-label'}>{label}</span>
      <select
        id={id}
        className={'admin-input min-h-11'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function FilterBar() {
  const { t } = useAdminI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const filter = parseAnalyticsFilter(Object.fromEntries(searchParams))

  function update(next: AnalyticsFilter) {
    const params = analyticsFilterToSearchParams(next)
    // 페이지 상세 경로(page)·탐색 설정(dims, metrics, limit)은 필터가 아니라 직렬화에 없다. 필터를 바꿔도 남긴다.
    searchParams.forEach((value, key) => {
      if (!FILTER_KEYS.has(key)) params.set(key, value)
    })
    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    })
  }

  const set = <K extends keyof AnalyticsFilter>(
    key: K,
    value: AnalyticsFilter[K]
  ) => update({ ...filter, [key]: value })
  const all = { value: '', label: t('analyticsAll') }

  return (
    <section
      aria-label={t('analyticsFiltersLabel')}
      className={'flex flex-wrap items-end gap-3'}
      aria-busy={pending}
    >
      <Select
        id={'analytics-range'}
        label={t('analyticsRange')}
        value={filter.range}
        options={RANGE_PRESETS.map((range) => ({
          value: range,
          label: t(RANGE_LABELS[range]),
        }))}
        onChange={(value) =>
          update({
            ...filter,
            range: value as AnalyticsFilter['range'],
            from: null,
            to: null,
          })
        }
      />
      {filter.range === 'custom' && (
        <>
          <label className={'flex flex-col gap-1'}>
            <span className={'admin-field-label'}>{t('analyticsFrom')}</span>
            <input
              type={'date'}
              className={'admin-input min-h-11'}
              value={filter.from ?? ''}
              onChange={(event) => set('from', event.target.value || null)}
            />
          </label>
          <label className={'flex flex-col gap-1'}>
            <span className={'admin-field-label'}>{t('analyticsTo')}</span>
            <input
              type={'date'}
              className={'admin-input min-h-11'}
              value={filter.to ?? ''}
              onChange={(event) => set('to', event.target.value || null)}
            />
          </label>
        </>
      )}
      <Select
        id={'analytics-channel'}
        label={t('analyticsChannel')}
        value={filter.channel ?? ''}
        options={[
          all,
          ...CHANNELS.map((channel) => ({ value: channel, label: channel })),
        ]}
        onChange={(value) =>
          set('channel', (value || null) as AnalyticsFilter['channel'])
        }
      />
      <Select
        id={'analytics-device'}
        label={t('analyticsDevice')}
        value={filter.device ?? ''}
        options={[
          all,
          ...DEVICE_TYPES.map((device) => ({ value: device, label: device })),
        ]}
        onChange={(value) =>
          set('device', (value || null) as AnalyticsFilter['device'])
        }
      />
      <Select
        id={'analytics-visitor'}
        label={t('analyticsVisitorType')}
        value={filter.visitor ?? ''}
        options={[
          all,
          { value: 'new', label: t('analyticsNewUsers') },
          { value: 'returning', label: t('analyticsReturningUsers') },
        ]}
        onChange={(value) =>
          set('visitor', (value || null) as AnalyticsFilter['visitor'])
        }
      />
      <Select
        id={'analytics-locale'}
        label={t('analyticsLocale')}
        value={filter.locale ?? ''}
        options={[
          all,
          { value: 'ko', label: '한국어' },
          { value: 'en', label: 'English' },
        ]}
        onChange={(value) =>
          set('locale', (value || null) as AnalyticsFilter['locale'])
        }
      />
      <Select
        id={'analytics-group'}
        label={t('analyticsContentGroup')}
        value={filter.contentGroup ?? ''}
        options={[
          all,
          ...CONTENT_GROUPS.map((group) => ({ value: group, label: group })),
        ]}
        onChange={(value) =>
          set(
            'contentGroup',
            (value || null) as AnalyticsFilter['contentGroup']
          )
        }
      />
      <label className={'flex min-w-48 flex-col gap-1'}>
        <span className={'admin-field-label'}>
          {t('analyticsPathContains')}
        </span>
        <input
          key={filter.path ?? ''}
          type={'search'}
          className={'admin-input min-h-11'}
          defaultValue={filter.path ?? ''}
          onKeyDown={(event) => {
            if (event.key === 'Enter')
              set('path', event.currentTarget.value.trim() || null)
          }}
          onBlur={(event) => {
            const value = event.currentTarget.value.trim() || null
            if (value !== filter.path) set('path', value)
          }}
        />
      </label>
      <label className={'flex min-h-11 items-center gap-2'}>
        <input
          type={'checkbox'}
          checked={filter.compare}
          onChange={(event) => set('compare', event.target.checked)}
        />
        <span className={'type-body-sm text-ink'}>{t('analyticsCompare')}</span>
      </label>
      <label className={'flex min-h-11 items-center gap-2'}>
        <input
          type={'checkbox'}
          checked={filter.includeInternal}
          onChange={(event) => set('includeInternal', event.target.checked)}
        />
        <span className={'type-body-sm text-ink'}>
          {t('analyticsIncludeInternal')}
        </span>
      </label>
      <button
        type={'button'}
        className={'admin-btn-ghost'}
        onClick={() => update(DEFAULT_ANALYTICS_FILTER)}
      >
        {t('analyticsResetFilters')}
      </button>
      {pending && (
        <span
          role={'status'}
          className={'type-caption text-ink-muted min-h-11 content-center'}
        >
          {t('analyticsUpdating')}
        </span>
      )}
    </section>
  )
}
