// 웹 폼·MCP 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'
import {
  MAX_ID_LENGTH,
  MAX_PEOPLE,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/lib/validations/limits'

const memberId = z
  .string()
  .trim()
  .min(1, 'Member is required')
  .max(MAX_ID_LENGTH, 'Invalid member')

// 주 소속·겸임 목록에는 각각 중복이 없어야 하며 같은 멤버를 두 목록에 넣을 수 없다.
export const partValidation = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .trim()
      .nonempty('Name is required')
      .max(MAX_TITLE_LENGTH, 'Name is too long'),
    description: z
      .string()
      .max(MAX_SUMMARY_LENGTH, 'Description is too long')
      .nullable(),
    displayOrder: z.number().int().min(-2147483648).max(2147483647).optional(),
    generationId: z
      .number({ message: 'Invalid Generation' })
      .int({ message: 'Invalid Generation' })
      .gte(1, { message: 'Invalid Generation' })
      .lte(2147483647, { message: 'Invalid Generation' }),
    membersList: z
      .array(memberId)
      .max(MAX_PEOPLE, `Up to ${MAX_PEOPLE} members`)
      .refine((list) => new Set(list).size === list.length, {
        message: 'Duplicate members are not allowed.',
      }),
    doubleBoardMembersList: z
      .array(memberId)
      .max(MAX_PEOPLE, `Up to ${MAX_PEOPLE} members`)
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
