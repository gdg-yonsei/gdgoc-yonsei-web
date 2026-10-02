/**
 * 멤버 표시 이름 규칙. 관리자·공개 사이트·MCP가 모두 이 함수로 이름을 만든다.
 */

/**
 * 성·이름으로 표시 이름을 만든다. 성·이름이 없으면 GitHub/Google 계정 이름(`name`), 그것도 없으면
 * `Unknown User`.
 *
 * - 외국인: `이름 성`(예: `John Smith`)
 * - 한국어 이름(`isKorean`): 띄어 쓰지 않은 `성이름`(예: `김민지`)
 * - 그 외(한국인의 영문 이름): `성 이름`(예: `Kim Minji`)
 * @param name 계정 이름(성·이름이 없을 때 대신 쓴다)
 * @param firstName 이름
 * @param lastName 성
 * @param isForeigner 외국인 여부
 * @param isKorean 한국어 성·이름을 넘겼는지
 */
export function formatUserName(
  name: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  isForeigner: boolean = false,
  isKorean: boolean = false
) {
  if (firstName && lastName) {
    if (isForeigner) {
      return `${firstName} ${lastName}`
    }
    if (isKorean) {
      return `${lastName}${firstName}`
    } else {
      return `${lastName} ${firstName}`
    }
  }
  if (name) {
    return name
  }
  return 'Unknown User'
}
