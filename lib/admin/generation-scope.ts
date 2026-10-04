/**
 * 웹 쿠키와 MCP가 공유하는 기수 범위 타입·해석 규칙. 요청이나 DB에 의존하지 않는 순수 함수다.
 */
/** "전체 기수"를 뜻하는 쿠키 값(LEAD 전용). */
export const ADMIN_GENERATION_SCOPE_ALL = 'all'

/** 기수 선택지(ID와 이름). */
export type AdminGenerationOption = {
  id: number
  name: string
}

/** 해석된 범위: 특정 기수 하나 또는 전체 기수. */
export type AdminGenerationScope =
  | {
      kind: 'generation'
      generationId: number
    }
  | {
      kind: 'all'
    }

/** 요청 값(쿠키 값 등)이 고를 수 있는 기수나 "전체"를 가리키면 범위로 바꾼다. 아니면 `null`. */
function parseRequestedGenerationScope(
  rawValue: string | undefined,
  options: AdminGenerationOption[],
  canAccessAll: boolean
): AdminGenerationScope | null {
  if (canAccessAll && rawValue === ADMIN_GENERATION_SCOPE_ALL) {
    return { kind: 'all' }
  }

  const generationId = Number(rawValue)
  if (!Number.isInteger(generationId)) {
    return null
  }

  const matched = options.find((option) => option.id === generationId)
  if (!matched) {
    return null
  }

  return {
    kind: 'generation',
    generationId: matched.id,
  }
}

/**
 * 요청된 기수 범위 값(쿠키 값, MCP 인자 등)을 접근 가능한 기수 목록에 맞춰 해석한다.
 *
 * 규칙: LEAD만 `all`을 고를 수 있고, 값이 없거나 권한 밖이면 가장 최근의 접근 가능
 * 기수로 대체한다. 접근 가능한 기수가 없으면 `null`. 웹(쿠키)과 서비스(MCP)가 같은
 * 규칙을 쓰도록 이 함수 하나에 둔다.
 */
export function resolveScopeFromOptions(
  options: AdminGenerationOption[],
  canAccessAll: boolean,
  requestedValue: string | undefined
): AdminGenerationScope | null {
  const fallback = options[0]
  if (!fallback) {
    return null
  }

  return (
    parseRequestedGenerationScope(requestedValue, options, canAccessAll) ?? {
      kind: 'generation',
      generationId: fallback.id,
    }
  )
}

/** 범위를 쿠키에 저장할 문자열로 바꾼다(`all` 또는 기수 ID). */
export function serializeAdminGenerationScope(
  scope: AdminGenerationScope | null
): string {
  if (!scope) {
    return ''
  }

  return scope.kind === 'all'
    ? ADMIN_GENERATION_SCOPE_ALL
    : String(scope.generationId)
}
