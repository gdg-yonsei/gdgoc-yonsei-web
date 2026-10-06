import { formatUserName } from '@/lib/format/user-name'

/** id 기준으로 중복을 제거한다. 먼저 나온 항목이 남는다. */
export function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

export type MemberMembership = {
  generationId: number | null
  generation: string | null
  part: string | null
  partId?: number | null
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

  for (const { generationId, generation, part, partId, ...member } of rows) {
    const membership = {
      generationId,
      generation,
      part,
      ...(partId === undefined ? {} : { partId }),
    }
    const existing = grouped.get(member.id)
    if (existing) {
      existing.memberships.push(membership)
    } else {
      grouped.set(member.id, { ...member, memberships: [membership] })
    }
  }

  return Array.from(grouped.values())
}

export type NamedMember = {
  name: string | null
  firstName: string | null
  lastName: string | null
  firstNameKo: string | null
  lastNameKo: string | null
  isForeigner: boolean
}

// 한글 이름을 우선하고 없으면 영문 이름을 쓴다. 외국인은 이름 성 순서다.
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

// 김 승연처럼 띄어 입력해도 찾도록 공백을 모두 없애고 소문자로 비교한다.
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
  part: string,
  partKey: 'part' | 'partId' = 'part'
): MemberMembership | undefined {
  return memberships.find(
    (membership) =>
      (!generation || membership.generation === generation) &&
      (!part ||
        (membership[partKey] != null && String(membership[partKey]) === part))
  )
}

// 소속 없음 값은 실제 기수·파트 이름과 충돌하지 않도록 이름으로 쓸 수 없는 값을 쓴다.
export const NO_MEMBERSHIP = '__none__'

// NO_MEMBERSHIP은 기수·파트가 모두 비어 있는 멤버만 고른다. 빈 필터는 모두 허용한다.
export function matchesMembershipFilter(
  memberships: readonly MemberMembership[],
  generation: string,
  part: string,
  partKey: 'part' | 'partId' = 'part'
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
  return Boolean(findMembership(memberships, generation, part, partKey))
}

export function toMemberships(
  usersToParts: readonly {
    part: {
      id: number
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
    partId: part.id,
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

/** 필터 값과 표시명. 파트 구성원은 DB ID, 세션 참가자는 기존처럼 이름으로 고른다. */
export function listMembershipPartOptions(
  members: readonly { memberships: readonly MemberMembership[] }[],
  generation: string,
  partKey: 'part' | 'partId' = 'part'
): { value: string; label: string }[] {
  if (partKey === 'part') {
    return listMembershipParts(members, generation).map((part) => ({
      value: part,
      label: part,
    }))
  }
  const options = new Map<string, string>()
  for (const { memberships } of members) {
    for (const membership of memberships) {
      if (
        membership.partId == null ||
        !membership.part ||
        (generation && membership.generation !== generation)
      )
        continue
      options.set(
        String(membership.partId),
        membership.generation
          ? `${membership.part} · ${membership.generation}`
          : membership.part
      )
    }
  }
  return [...options]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label))
}
