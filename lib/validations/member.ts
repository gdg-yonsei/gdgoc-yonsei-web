import { z } from 'zod'

// 프로필의 비공개 필드(전공/학번/전화번호)는 비워 둘 수 있어야 한다 —
// 폼의 개인정보 안내 문구가 빈 입력을 허용한다고 약속하고 있다.
// 폼 필드가 없거나 빈 문자열이면 null 로 정규화한다.
const nullableTrimmed = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()

/**
 * Member 데이터 타입 검증 스키마
 */
export const memberValidation = z.object({
  name: z.string().trim().nonempty('Name is required'),
  firstName: z.string().trim().nonempty('First Name (English) is required'),
  firstNameKo: z.string().trim().nonempty('First Name (Korean) is required'),
  lastName: z.string().trim().nonempty('Last Name (English) is required'),
  lastNameKo: z.string().trim().nonempty('Last Name (Korean) is required'),
  email: z.string().email(),
  githubId: nullableTrimmed,
  instagramId: nullableTrimmed,
  linkedInId: nullableTrimmed,
  major: nullableTrimmed,
  studentId: z
    .string()
    .trim()
    .regex(/^\d*$/, 'Student ID must contain numbers only')
    .transform((value) => (value === '' ? null : value))
    .nullable(),
  telephone: z
    .string()
    .trim()
    .regex(
      /^[\d -]*$/,
      'Telephone must contain only numbers, spaces, and hyphens'
    )
    .transform((value) => (value === '' ? null : value))
    .nullable(),
  role: z.enum(['MEMBER', 'CORE', 'LEAD', 'ALUMNUS', 'UNVERIFIED']).nullable(),
  isForeigner: z.boolean(),
  // 빈 문자열은 유효한 이미지 URL 이 아니므로 null 로 정규화한다.
  profileImage: nullableTrimmed,
})
