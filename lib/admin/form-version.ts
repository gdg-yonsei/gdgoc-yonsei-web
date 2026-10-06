// Activity가 유지한 비제어 폼은 이전 편집값이 남으므로 updatedAt key로 다시 마운트한다.
export function savedVersionKey(updatedAt: Date | null | undefined): string {
  return updatedAt?.toISOString() ?? 'new'
}
