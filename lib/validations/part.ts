// 웹 폼·MCP 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'

// 주 소속·겸임 목록에는 각각 중복이 없어야 하며 같은 멤버를 두 목록에 넣을 수 없다.
export const partValidation = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .trim()
      .nonempty('Name is required'),
    description: z.string().nullable(),
    displayOrder: z.number().int().min(-2147483648).max(2147483647).optional(),
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

    const duplicates = membersList.filter((m) =>
      doubleBoardMembersList.includes(m)
    )

    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'There are duplicate members between members and double board members.',
        path: ['membersList'],
      })
    }
  })
