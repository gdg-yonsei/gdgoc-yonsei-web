import { z } from 'zod'

/**
 * Generation 데이터 타입 검증 스키마
 */
export const generationValidation = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .nonempty('Name is required'),
    startDate: z.string().date('Invalid Start Date Format'),
    endDate: z.string().date('Invalid End Date Format'),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'The end date must be later than the start date.',
    path: ['endDate'], // 오류가 표시될 경로 지정
  })
