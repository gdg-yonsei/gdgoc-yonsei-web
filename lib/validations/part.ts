import { z } from 'zod'

/**
 * Part 데이터 타입 검증 스키마
 */
export const partValidation = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .trim()
      .nonempty('Name is required'),
    description: z.string().nullable(),
    generationId: z
      .number({ message: 'Invalid Generation' })
      .gte(1, { message: 'Invalid Generation' }),
    membersList: z
      .array(z.string().trim().min(1, 'Member is required'))
      .refine((list) => new Set(list).size === list.length, {
        message: 'Duplicate members are not allowed.',
      }),
    doubleBoardMembersList: z
      .array(z.string().trim().min(1, 'Member is required'))
      .refine((list) => new Set(list).size === list.length, {
        message: 'Duplicate members are not allowed.',
      }),
  })
  .superRefine((data, ctx) => {
    const { membersList, doubleBoardMembersList } = data

    // 교집합 검사
    const duplicates = membersList.filter((m) =>
      doubleBoardMembersList.includes(m)
    )

    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'There are duplicate members between members and double board members.',
        path: ['membersList'], // 혹은 ['doubleBoardMembersList'] 또는 둘 다
      })
    }
  })
