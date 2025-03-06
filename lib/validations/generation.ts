import { z } from 'zod'
import { dateRegex } from '@/lib/yyyy-mm-dd-regex'

/**
 * Generation 데이터 타입 검증 스키마
 */
export const generationValidation = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .nonempty('Name is required'),
    startDate: z.string().refine((date) => dateRegex.test(date), {
      message: 'Invalid date format. Use YYYY-MM-DD.',
    }),
    endDate: z.string().refine((date) => dateRegex.test(date), {
      message: 'Invalid date format. Use YYYY-MM-DD.',
    }),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'The end date must be later than the start date.',
    path: ['endDate'], // 오류가 표시될 경로 지정
  })
