/**
 * 다른 사용자에게 보여도 되는 사용자 필드만 고르는 헬퍼.
 */
import 'server-only'

type UserRow = {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  firstNameKo: string | null
  lastNameKo: string | null
  image: string | null
}

/**
 * 다른 사용자에게 보여 줄 수 있는 필드만 남긴다.
 * 이메일·전화번호·학번은 멤버 상세 조회 권한이 있을 때만 get_member 로 본다.
 */
export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    firstNameKo: user.firstNameKo,
    lastNameKo: user.lastNameKo,
    image: user.image,
  }
}
