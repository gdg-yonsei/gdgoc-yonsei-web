// 웹 폼·MCP 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'
import { MAX_TITLE_LENGTH, MAX_URL_LENGTH } from '@/lib/validations/limits'

// 개인정보 안내대로 전공·학번·전화번호는 비울 수 있어야 한다. 빈 문자열은 null로 저장한다.
const nullableTrimmed = (max = MAX_TITLE_LENGTH) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((value) => (value === '' ? null : value))
    .nullable()

const requiredName = (message: string) =>
  z
    .string()
    .trim()
    .nonempty(message)
    .max(MAX_TITLE_LENGTH, `Must be ${MAX_TITLE_LENGTH} characters or fewer`)

/** 멤버 프로필. 역할(`role`)은 역할 변경 권한이 있을 때만 서비스가 반영한다. */
export const memberValidation = z.object({
  name: requiredName('Name is required'),
  firstName: requiredName('First Name (English) is required'),
  firstNameKo: requiredName('First Name (Korean) is required'),
  lastName: requiredName('Last Name (English) is required'),
  lastNameKo: requiredName('Last Name (Korean) is required'),
  // 로그인 계정 연결이 소문자 이메일로 사용자를 찾으므로 같은 형태로 저장한다.
  email: z.string().trim().toLowerCase().max(254).email(),
  githubId: nullableTrimmed(),
  instagramId: nullableTrimmed(),
  linkedInId: nullableTrimmed(MAX_URL_LENGTH),
  major: nullableTrimmed(),
  studentId: z
    .string()
    .trim()
    .max(10, 'Student ID is too long')
    .regex(/^\d*$/, 'Student ID must contain numbers only')
    .transform((value) => (value === '' ? null : value))
    .nullable(),
  telephone: z
    .string()
    .trim()
    .max(30, 'Telephone is too long')
    .regex(
      /^[\d -]*$/,
      'Telephone must contain only numbers, spaces, and hyphens'
    )
    .transform((value) => (value === '' ? null : value))
    .nullable(),
  role: z.enum(['MEMBER', 'CORE', 'LEAD', 'ALUMNUS', 'UNVERIFIED']).nullable(),
  isForeigner: z.boolean(),
  profileImage: nullableTrimmed(MAX_URL_LENGTH),
})
