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

// 이메일·전화번호·학번은 멤버 상세 조회 권한이 있을 때만 get_member로 공개한다.
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
