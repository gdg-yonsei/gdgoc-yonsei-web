import { z } from 'zod'
import { dateRegex } from '@/lib/yyyy-mm-dd-regex'

const generationDateSchema = z.string().refine((date) => dateRegex.test(date), {
  message: 'Invalid date format. Use YYYY-MM-DD.',
})

/**
 * Generation 데이터 타입 검증 스키마
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
