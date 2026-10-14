/** 공개 사이트 경로를 콘텐츠 그룹으로 묶는다. 같은 정규식 표를 SQL(`~`)에서도 써서 화면과 집계가 어긋나지 않게 한다. */

export const CONTENT_GROUPS = [
  'home',
  'session-list',
  'session-detail',
  'project-list',
  'project-detail',
  'member',
  'calendar',
  'legal',
  'other',
] as const

export type ContentGroup = (typeof CONTENT_GROUPS)[number]

/** 위에서부터 먼저 맞는 규칙이 이긴다. Postgres POSIX 정규식과 JS 정규식 양쪽에서 같은 뜻인 문법만 쓴다. */
export const CONTENT_GROUP_RULES: ReadonlyArray<{
  group: ContentGroup
  pattern: string
}> = [
  { group: 'home', pattern: '^/(en|ko)$' },
  { group: 'session-detail', pattern: '^/(en|ko)/session/[^/]+/[^/]+$' },
  { group: 'session-list', pattern: '^/(en|ko)/session(/[^/]+)?$' },
  { group: 'project-detail', pattern: '^/(en|ko)/project/[^/]+/[^/]+$' },
  { group: 'project-list', pattern: '^/(en|ko)/project(/[^/]+)?$' },
  { group: 'member', pattern: '^/(en|ko)/member(/[^/]+)?$' },
  { group: 'calendar', pattern: '^/(en|ko)/calendar$' },
  { group: 'legal', pattern: '^/(en|ko)/(privacy-policy|terms-of-service)$' },
]

const COMPILED = CONTENT_GROUP_RULES.map((rule) => ({
  ...rule,
  regex: new RegExp(rule.pattern),
}))

export function contentGroupOf(path: string): ContentGroup {
  return COMPILED.find((rule) => rule.regex.test(path))?.group ?? 'other'
}
