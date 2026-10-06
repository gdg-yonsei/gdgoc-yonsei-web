// 웹 폼·MCP 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'

// 개인정보 안내대로 전공·학번·전화번호는 비울 수 있어야 한다. 빈 문자열은 null로 저장한다.
const nullableTrimmed = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()

/** 멤버 프로필. 역할(`role`)은 역할 변경 권한이 있을 때만 서비스가 반영한다. */
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
  profileImage: nullableTrimmed,
})
