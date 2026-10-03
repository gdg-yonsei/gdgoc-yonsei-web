/**
 * 수정 폼의 `key`. Next는 방문한 페이지를 마운트한 채 유지하므로(Activity), 저장 후 같은 수정 화면으로
 * 돌아오면 비제어 입력에 이전 편집 내용이 남는다. 저장된 버전(`updatedAt`)마다 key를 바꿔 폼을 다시
 * 마운트하면 입력이 저장된 값으로 다시 채워진다.
 */
export function savedVersionKey(updatedAt: Date | null | undefined): string {
  return updatedAt?.toISOString() ?? 'new'
}
