/** "전체 기수"를 뜻하는 쿠키 값(LEAD 전용). */
export const ADMIN_GENERATION_SCOPE_ALL = 'all'

export type AdminGenerationOption = {
  id: number
  name: string
}

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

// all은 LEAD 전용이다. 값이 없거나 권한 밖이면 접근 가능한 최신 기수, 접근 가능한 기수가 없으면 null이다.
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
