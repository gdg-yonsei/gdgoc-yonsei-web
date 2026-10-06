import 'server-only'

// null·undefined 입력은 빈 문자열로 정리한다.
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

// 관계 삭제·삽입을 원자적으로 묶으려면 호출부가 같은 트랜잭션 안에서 실행해야 한다.
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
