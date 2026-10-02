/**
 * 기수 입력 스키마.
 *
 * 입력 검증 스키마(zod). 서비스 계층이 웹 폼과 MCP 입력을 모두 이 스키마로 검증한다.
 * 오류 문구는 관리자 화면과 MCP 응답에 그대로 보이므로 영어로 쓴다.
 */
import { z } from 'zod'
import { dateRegex } from '@/lib/yyyy-mm-dd-regex'

/** `YYYY-MM-DD` 날짜 문자열. */
const generationDateSchema = z.string().refine((date) => dateRegex.test(date), {
  message: 'Invalid date format. Use YYYY-MM-DD.',
})

/**
 * 기수 입력. 이름은 URL에 쓰이므로 영문·숫자·하이픈만 허용한다(예: `25-26`).
 * 종료일은 비워 둘 수 있고, 있으면 시작일보다 뒤여야 한다.
 */
export const generationValidation = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .trim()
      .nonempty('Name is required')
      .max(50, 'Name is too long')
      .regex(
        /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
        'Name must be URL-safe and contain only letters, numbers, or single hyphens'
      ),
    startDate: generationDateSchema,
    endDate: z
      .string()
      .nullable()
      .transform((value) => (value === '' ? null : value))
      .refine((value) => value === null || dateRegex.test(value), {
        message: 'Invalid date format. Use YYYY-MM-DD.',
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.endDate &&
      new Date(data.startDate).getTime() > new Date(data.endDate).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The end date must be later than the start date.',
        path: ['endDate'],
      })
    }
  })
