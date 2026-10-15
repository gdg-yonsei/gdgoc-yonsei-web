'use client'

/**
 * bklit ui 차트를 분석 화면에 맞추는 공용 조각: 구간 키↔Date 변환, 날짜 라벨 현지화, 범주 색 순서, 범례, 툴팁 면.
 * 범주 색은 admin.css의 검증된 --chart-1..8을 넘긴 순서대로 고정 배정한다(색은 순위가 아니라 항목을 따른다).
 */
import { MotionConfig, useReducedMotion } from 'motion/react'
import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { formatBucketLabel } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { ChartDateFormatContext } from '@/app/components/admin/charts/chart-formatters'

export function seriesColor(index: number) {
  return `var(--chart-${(index % 8) + 1})`
}

/** 구간 키(YYYY-MM-DD 또는 YYYY-MM-DDTHH)는 표시 시각 그대로라 UTC로 읽고 UTC로 되돌려 형식을 맞춘다. */
export function bucketToDate(bucket: string) {
  return new Date(
    bucket.length === 13 ? `${bucket}:00:00Z` : `${bucket}T00:00:00Z`
  )
}

function dateToBucket(date: Date, hourly: boolean) {
  const iso = date.toISOString()
  return hourly ? iso.slice(0, 13) : iso.slice(0, 10)
}

/** 축과 툴팁 날짜를 관리자 언어로 쓴다. 시간 단위 여부는 데이터의 구간 키 길이로 정한다. */
export function BucketDateFormat({
  hourly,
  children,
}: {
  hourly: boolean
  children: ReactNode
}) {
  const { locale } = useAdminI18n()
  const value = useMemo(() => {
    const format = (date: Date) =>
      formatBucketLabel(dateToBucket(date, hourly), locale)
    return { axis: format, tooltip: format }
  }, [hourly, locale])
  return (
    <ChartDateFormatContext.Provider value={value}>
      {children}
    </ChartDateFormatContext.Provider>
  )
}

/** 운영체제의 동작 줄이기 설정을 차트 애니메이션에도 적용한다. */
export function ChartMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion={'user'}>{children}</MotionConfig>
}

/** 동작 줄이기가 켜지면 차트 등장 시간을 0으로 만든다. */
export function useChartAnimationMs(ms: number) {
  return useReducedMotion() ? 0 : ms
}

/**
 * 툴팁은 메뉴처럼 떠 있는 면이다. 관리자 헤더·서랍과 겹쳐 흐림이 3개가 되지 않도록 블러를 끄고 경계선을 둔다.
 */
export const TOOLTIP_PANEL_STYLE: CSSProperties = {
  backdropFilter: 'none',
  border: '1px solid var(--hairline)',
}

export type LegendItem = { label: string; color: string }

/** 시리즈가 2개 이상일 때만 쓴다. 글자는 잉크색이고 색은 옆의 표시가 맡는다. */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul
      className={
        'type-caption text-ink-secondary flex flex-wrap gap-x-4 gap-y-1'
      }
    >
      {items.map((item) => (
        <li key={item.label} className={'flex items-center gap-1.5'}>
          <span
            aria-hidden={'true'}
            className={'size-2.5 shrink-0 rounded-full'}
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
