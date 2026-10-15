/**
 * 방문 분석·Search Console 읽기 도구. 웹 분석 화면과 같은 서비스를 쓰고, 필터는 URL 쿼리와 같은 파서로 검증한다.
 * 모두 읽기 전용이라 감사 로그에 남기지 않는다.
 */
import 'server-only'

import { z } from 'zod'
import { CHANNELS } from '@/lib/analytics/constants'
import { CONTENT_GROUPS } from '@/lib/analytics/content-groups'
import { resolveDateRange } from '@/lib/analytics/date-range'
import {
  DEVICE_TYPES,
  RANGE_PRESETS,
  parseAnalyticsFilter,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import { SESSION_METRIC_KEYS } from '@/lib/analytics/metrics'
import { defineTool } from '@/lib/mcp/registry'
import { SESSION_DIMENSIONS } from '@/lib/server/analytics/queries/sessions'
import {
  ANALYTICS_TABLE_REPORTS,
  getAnalyticsOverview,
  getAnalyticsPageDetail,
  getAnalyticsTable,
} from '@/lib/server/services/admin/analytics'
import {
  getSearchConsoleTable,
  getSeoOpportunities,
} from '@/lib/server/services/admin/search-console'
import { fail, ok } from '@/lib/server/services/admin/types'

// 형식만 보는 정규식은 2026-02-30 같은 없는 날짜를 통과시켜, 웹 파서가 조용히 28일로 되돌린다.
const date = z.iso.date().describe('Seoul date, YYYY-MM-DD.')

/** 직접 지정 기간은 from·to를 모두 요구하고, 다른 프리셋과 함께 온 날짜는 거절한다. 엉뚱한 기간의 숫자를 답하지 않게 한다. */
function checkCustomRange(
  input: { range?: string; from?: string; to?: string },
  context: z.RefinementCtx
) {
  if (input.range === 'custom' && (!input.from || !input.to)) {
    context.addIssue({
      code: 'custom',
      message: 'range "custom" needs both from and to.',
      path: ['range'],
    })
  }
  if (input.range !== 'custom' && (input.from || input.to)) {
    context.addIssue({
      code: 'custom',
      message: 'from and to are only used with range "custom".',
      path: ['range'],
    })
  }
}

const filterFields = {
  range: z
    .enum(RANGE_PRESETS)
    .optional()
    .describe('Date range preset. Default 28d. Use custom with from and to.'),
  from: date
    .optional()
    .describe('Custom range start (inclusive), only with range "custom".'),
  to: date
    .optional()
    .describe('Custom range end (inclusive), only with range "custom".'),
  compare: z
    .boolean()
    .optional()
    .describe('Include the previous period of the same length. Default true.'),
  channel: z
    .enum(CHANNELS)
    .optional()
    .describe('Only sessions from this traffic channel.'),
  device: z.enum(DEVICE_TYPES).optional(),
  country: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .optional()
    .describe('ISO 3166 alpha-2 country, estimated from time zone.'),
  locale: z
    .enum(['ko', 'en'])
    .optional()
    .describe('Public site language of the viewed pages.'),
  visitor: z.enum(['new', 'returning']).optional(),
  contentGroup: z.enum(CONTENT_GROUPS).optional(),
  path: z
    .string()
    .max(200)
    .optional()
    .describe(
      'Only pages whose path contains this text (literal, not a pattern).'
    ),
  includeInternal: z
    .boolean()
    .optional()
    .describe('Include visits by signed-in GYMS members. Default false.'),
}

type FilterInput = {
  [K in keyof typeof filterFields]?: z.infer<(typeof filterFields)[K]>
}

// 웹 화면과 같은 파서로 검증해 기본값·날짜 보정이 같게 동작한다.
function toFilter(input: FilterInput): AnalyticsFilter {
  return parseAnalyticsFilter({
    range: input.range,
    from: input.from,
    to: input.to,
    compare: input.compare === false ? '0' : undefined,
    channel: input.channel,
    device: input.device,
    country: input.country,
    locale: input.locale,
    visitor: input.visitor,
    group: input.contentGroup,
    path: input.path,
    internal: input.includeInternal ? '1' : undefined,
  })
}

const NOT_CONFIGURED =
  'Search Console is not connected. A LEAD must set GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY and GSC_SITE_URL (see docs/architecture/analytics.md).'

const gate = [{ action: 'get' as const, resource: 'analyticsPage' as const }]
const readOnly = { readOnlyHint: true, openWorldHint: false }

export const analyticsTools = [
  defineTool({
    name: 'analytics_overview',
    title: 'Analytics overview',
    description:
      'Public site traffic for a date range: users, new users, sessions, engagement rate, bounce rate, views, average engagement time and key events, with the previous period, a time series, top channels, devices and pages. Member visits are excluded unless includeInternal is true.',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z.object(filterFields).superRefine(checkCustomRange),
    run: (actor, input) => getAnalyticsOverview(actor, toFilter(input)),
  }),
  defineTool({
    name: 'analytics_report',
    title: 'Analytics report',
    description:
      'One analytics table: channels, sources, referrers, campaigns, landing_pages, devices, browsers, os, screens, countries, languages, pages, events, not_found (broken links), web_vitals, or explore (pick up to two dimensions and any metrics).',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z
      .object({
        ...filterFields,
        report: z.enum(ANALYTICS_TABLE_REPORTS),
        dimensions: z
          .array(z.enum(SESSION_DIMENSIONS))
          .max(2)
          .optional()
          .describe('explore only. Up to two breakdowns.'),
        metrics: z
          .array(z.enum(SESSION_METRIC_KEYS))
          .min(1)
          .optional()
          .describe('explore only.'),
        limit: z.number().int().min(1).max(100).default(50),
      })
      .superRefine(checkCustomRange),
    run: async (actor, input) => {
      const filter = toFilter(input)
      const range = resolveDateRange(filter, new Date())
      const result = await getAnalyticsTable(actor, input.report, filter, {
        dimensions: input.dimensions ?? ['channel'],
        metrics: input.metrics ?? [
          'users',
          'sessions',
          'engagementRate',
          'avgEngagementSeconds',
        ],
        limit: input.limit,
      })
      return result.ok
        ? ok({
            ...result.data,
            rows: result.data.rows.slice(0, input.limit),
            range: {
              start: range.start.toISOString(),
              end: range.end.toISOString(),
            },
          })
        : result
    },
  }),
  defineTool({
    name: 'analytics_page_detail',
    title: 'Analytics page detail',
    description:
      'Detail for one public page path (e.g. /ko/session/25-26): views, users, time on page, exit rate, daily views, scroll depth, the pages before and after it, and traffic channels.',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z
      .object({
        ...filterFields,
        path: z
          .string()
          .startsWith('/')
          .max(512)
          .describe('Page path starting with /.'),
      })
      .superRefine(checkCustomRange),
    run: (actor, input) =>
      getAnalyticsPageDetail(
        actor,
        toFilter({ ...input, path: undefined }),
        input.path
      ),
  }),
  defineTool({
    name: 'search_console_report',
    title: 'Search Console report',
    description:
      'Google search performance from Search Console by query, page, device, country or date: clicks, impressions, CTR and average position. Only the device and path filters apply. Data lags two to three days.',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z
      .object({
        range: filterFields.range,
        from: filterFields.from,
        to: filterFields.to,
        device: filterFields.device,
        path: filterFields.path,
        dimension: z.enum(['query', 'page', 'device', 'country', 'date']),
        limit: z.number().int().min(1).max(500).default(50),
      })
      .superRefine(checkCustomRange),
    run: async (actor, input) => {
      const result = await getSearchConsoleTable(
        actor,
        input.dimension,
        toFilter(input),
        input.limit
      )
      if (!result.ok) return result
      return result.data.configured
        ? ok(result.data)
        : fail('NOT_FOUND', NOT_CONFIGURED)
    },
  }),
  defineTool({
    name: 'seo_opportunities',
    title: 'SEO opportunities',
    description:
      'Three lists to act on: queries shown often but clicked rarely (fix titles and descriptions), queries ranked 8 to 20 (strengthen content), and pages organic visitors leave quickly (match the search intent).',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z
      .object({
        range: filterFields.range,
        from: filterFields.from,
        to: filterFields.to,
        device: filterFields.device,
        path: filterFields.path,
      })
      .superRefine(checkCustomRange),
    run: async (actor, input) => {
      const result = await getSeoOpportunities(actor, toFilter(input))
      if (!result.ok) return result
      return result.data.configured
        ? ok(result.data)
        : fail('NOT_FOUND', NOT_CONFIGURED)
    },
  }),
]
