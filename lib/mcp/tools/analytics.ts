/**
 * 방문 분석·Search Console 읽기 도구. 웹 분석 화면과 같은 서비스를 쓰고, 필터는 URL 쿼리와 같은 파서로 검증한다.
 * 모두 읽기 전용이라 감사 로그에 남기지 않는다.
 */
import 'server-only'

import { z } from 'zod'
import { CHANNELS } from '@/lib/analytics/constants'
import { CONTENT_GROUPS } from '@/lib/analytics/content-groups'
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

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Seoul date, YYYY-MM-DD.')

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
    input: z.object(filterFields),
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
    input: z.object({
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
    }),
    run: async (actor, input) => {
      const result = await getAnalyticsTable(
        actor,
        input.report,
        toFilter(input),
        {
          dimensions: input.dimensions ?? ['channel'],
          metrics: input.metrics ?? [
            'users',
            'sessions',
            'engagementRate',
            'avgEngagementSeconds',
          ],
          limit: input.limit,
        }
      )
      return result.ok
        ? ok({ ...result.data, rows: result.data.rows.slice(0, input.limit) })
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
    input: z.object({
      ...filterFields,
      path: z
        .string()
        .startsWith('/')
        .max(512)
        .describe('Page path starting with /.'),
    }),
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
    input: z.object({
      range: filterFields.range,
      from: filterFields.from,
      to: filterFields.to,
      device: filterFields.device,
      path: filterFields.path,
      dimension: z.enum(['query', 'page', 'device', 'country', 'date']),
      limit: z.number().int().min(1).max(500).default(50),
    }),
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
    input: z.object({
      range: filterFields.range,
      from: filterFields.from,
      to: filterFields.to,
      device: filterFields.device,
      path: filterFields.path,
    }),
    run: async (actor, input) => {
      const result = await getSeoOpportunities(actor, toFilter(input))
      if (!result.ok) return result
      return result.data.configured
        ? ok(result.data)
        : fail('NOT_FOUND', NOT_CONFIGURED)
    },
  }),
]
