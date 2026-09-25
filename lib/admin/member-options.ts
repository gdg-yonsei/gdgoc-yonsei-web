export function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values())
}

export type MemberMembership = {
  generationId: number | null
  generation: string | null
  part: string | null
}

// getMembers는 (멤버, 기수)마다 한 행을 돌려주므로, 멤버별로 소속 기수·파트를 모읍니다.
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
