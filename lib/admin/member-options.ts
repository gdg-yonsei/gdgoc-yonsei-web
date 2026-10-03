/**
 * 관리자 멤버 선택 UI(세션 참가자, 파트 구성원)용 순수 헬퍼.
 *
 * 서버 fetcher가 돌려준 행을 화면에 맞게 묶고, 검색·필터 규칙을 제공한다.
 * 클라이언트 컴포넌트와 서버 코드 모두에서 쓰므로 순수 함수만 둔다.
 */
import { formatUserName } from '@/lib/format/user-name'

/** id 기준으로 중복을 제거한다. 먼저 나온 항목이 남는다. */
export function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

/** 멤버가 속한 기수·파트 한 건. */
export type MemberMembership = {
  generationId: number | null
  generation: string | null
  part: string | null
}

/** getMembers는 (멤버, 기수)마다 한 행을 돌려주므로, 멤버별로 소속 기수·파트를 모은다. */
export function groupMemberships<T extends { id: string } & MemberMembership>(
  rows: readonly T[]
): Array<
  Omit<T, keyof MemberMembership> & { memberships: MemberMembership[] }
> {
  const grouped = new Map<
    string,
    Omit<T, keyof MemberMembership> & { memberships: MemberMembership[] }
  >()

  for (const { generationId, generation, part, ...member } of rows) {
    const membership = { generationId, generation, part }
    const existing = grouped.get(member.id)
    if (existing) {
      existing.memberships.push(membership)
    } else {
      grouped.set(member.id, { ...member, memberships: [membership] })
    }
  }

  return Array.from(grouped.values())
}

/** 이름 표시에 필요한 멤버 필드. */
export type NamedMember = {
  name: string | null
  firstName: string | null
  lastName: string | null
  firstNameKo: string | null
  lastNameKo: string | null
  isForeigner: boolean
}

/**
 * 선택 목록에 보일 멤버 이름. 한글 이름이 있으면 한글 이름(외국인은 이름 성 순서),
 * 없으면 영문 이름을 쓴다.
 */
export function memberDisplayName(member: NamedMember): string {
  return member.firstNameKo
    ? formatUserName(
        member.name,
        member.firstNameKo,
        member.lastNameKo,
        member.isForeigner,
        !member.isForeigner
      )
    : formatUserName(
        member.name,
        member.firstName,
        member.lastName,
        member.isForeigner
      )
}

/**
 * 검색어 비교용 정규화. 한글 이름을 "김 승연"처럼 띄어 입력해도 찾을 수 있도록
 * 공백을 모두 지우고 소문자로 바꾼다.
 */
export function normalizeMemberSearch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '')
}

/** 멤버의 이름 필드 중 하나라도 검색어(정규화된 값)를 포함하는지. 빈 검색어는 항상 일치. */
export function memberMatchesSearch(
  member: NamedMember,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true
  return normalizeMemberSearch(
    [
      memberDisplayName(member),
      member.name,
      // "이름 성"과 "성 이름" 어느 순서로 입력해도 찾는다.
      `${member.firstName ?? ''}${member.lastName ?? ''}`,
      `${member.lastName ?? ''}${member.firstName ?? ''}`,
      `${member.lastNameKo ?? ''}${member.firstNameKo ?? ''}`,
      `${member.firstNameKo ?? ''}${member.lastNameKo ?? ''}`,
    ]
      .filter(Boolean)
      .join(' ')
  ).includes(normalizedQuery)
}

/** 기수·파트 필터에 맞는 소속을 찾는다. 빈 필터는 모든 값과 일치한다. */
export function findMembership(
  memberships: readonly MemberMembership[],
  generation: string,
  part: string
): MemberMembership | undefined {
  return memberships.find(
    (membership) =>
      (!generation || membership.generation === generation) &&
      (!part || membership.part === part)
  )
}

/**
 * 기수·파트 필터의 "소속 없음" 값. 어느 기수·파트에도 속하지 않은 멤버만 고른다. 실제 기수·파트 이름과
 * 겹치지 않도록 이름으로 쓸 수 없는 값을 쓴다.
 */
export const NO_MEMBERSHIP = '__none__'

/**
 * 멤버의 소속이 기수·파트 필터에 맞는지. 빈 필터는 모두 맞고, `NO_MEMBERSHIP`은 기수·파트가 모두 비어
 * 있는(소속이 없는) 멤버에만 맞는다.
 */
export function matchesMembershipFilter(
  memberships: readonly MemberMembership[],
  generation: string,
  part: string
): boolean {
  if (generation === NO_MEMBERSHIP || part === NO_MEMBERSHIP) {
    return (
      (!generation || generation === NO_MEMBERSHIP) &&
      (!part || part === NO_MEMBERSHIP) &&
      memberships.every(
        (membership) => !membership.generation && !membership.part
      )
    )
  }
  if (!generation && !part) return true
  return Boolean(findMembership(memberships, generation, part))
}

/** 파트 구성원 조회 결과(`usersToParts`)를 선택기의 소속 목록으로 바꾼다. */
export function toMemberships(
  usersToParts: readonly {
    part: {
      name: string
      generationsId: number | null
      generation: { id: number; name: string } | null
    }
  }[]
): MemberMembership[] {
  return usersToParts.map(({ part }) => ({
    generationId: part.generation?.id ?? part.generationsId,
    generation: part.generation?.name ?? null,
    part: part.name,
  }))
}

/** 멤버들이 속한 기수 이름 목록. 최신 기수(ID가 큰 순)가 먼저 온다. */
export function listMembershipGenerations(
  members: readonly { memberships: readonly MemberMembership[] }[]
): string[] {
  const generations = new Map<string, number>()
  for (const member of members) {
    for (const { generation, generationId } of member.memberships) {
      if (generation) generations.set(generation, generationId ?? 0)
    }
  }
  return [...generations.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([generation]) => generation)
}

/** 멤버들이 속한 파트 이름 목록(가나다순). 기수를 고르면 그 기수의 파트만 남긴다. */
export function listMembershipParts(
  members: readonly { memberships: readonly MemberMembership[] }[],
  generation: string
): string[] {
  return [
    ...new Set(
      members
        .flatMap((member) => member.memberships)
        .filter(
          (membership) => !generation || membership.generation === generation
        )
        .map((membership) => membership.part)
        .filter((part): part is string => Boolean(part))
    ),
  ].sort((left, right) => left.localeCompare(right))
}
