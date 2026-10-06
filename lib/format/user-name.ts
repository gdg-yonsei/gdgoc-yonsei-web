// 외국인은 이름 성, 한국어는 성이름, 한국인의 영문 이름은 성 이름 순서다.
// 성·이름이 없으면 계정 name, 그것도 없으면 Unknown User를 쓴다.
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
