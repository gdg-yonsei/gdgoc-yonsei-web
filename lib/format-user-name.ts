/**
 * 사용자 이름을 포멧하는 함수
 *
 * 만약 사용자가 Github Name만 가지고 있다면 Github Name을 반환하고 First Name과 Last Name이 모두 존재한다면 Last Name + First Name을 반환합니다.
 * 만약 사용자가 외국인이라면 First Name + Last Name을 반환합니다.
 * @param name
 * @param firstName
 * @param lastName
 * @param isForeigner
 */
export default function formatUserName(
  name: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  isForeigner: boolean = false
) {
  if (firstName && lastName) {
    if (isForeigner) {
      return `${firstName} ${lastName}`
    }
    return `${lastName} ${firstName}`
  }
  if (name) {
    return name
  }
  return 'Unknown User'
}
