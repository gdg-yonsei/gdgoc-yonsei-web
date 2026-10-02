/**
 * 관리자 서비스들이 함께 쓰는 작은 헬퍼.
 *
 * 리소스별 서비스(`generations`, `parts`, `projects`, `sessions`, `members`)에서
 * 반복되는 입력 정리와 관계 테이블 교체 로직을 모아 둔다.
 */
import 'server-only'

/**
 * 저장 전에 사용자 입력에서 `<`, `>` 문자를 제거한다.
 * `null`/`undefined`는 빈 문자열로 바꾼다.
 */
export function stripHtmlCharacters(value: string | null | undefined) {
  return value ? value.replaceAll('<', '').replaceAll('>', '') : ''
}

/** 행이 있을 때만 insert를 실행한다. 빈 배열 insert는 Drizzle에서 오류가 나기 때문이다. */
export async function insertRowsIfAny<Row>(
  rows: readonly Row[],
  insertRows: (rows: Row[]) => unknown
) {
  if (rows.length === 0) {
    return
  }

  await insertRows([...rows])
}

/**
 * 관계 테이블(다대다 연결)을 통째로 교체한다: 기존 행을 지우고 새 행을 넣는다.
 * 두 단계가 하나의 트랜잭션으로 묶여야 할 때는 호출부가 트랜잭션 안에서 부른다.
 */
export async function replaceRelationRows<Row>({
  deleteRows,
  rows,
  insertRows,
}: {
  deleteRows: () => unknown
  rows: readonly Row[]
  insertRows: (rows: Row[]) => unknown
}) {
  await deleteRows()
  await insertRowsIfAny(rows, insertRows)
}
