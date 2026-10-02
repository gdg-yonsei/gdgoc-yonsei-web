/**
 * 프로젝트 입력 스키마.
 *
 * 입력 검증 스키마(zod). 서비스 계층이 웹 폼과 MCP 입력을 모두 이 스키마로 검증한다.
 * 오류 문구는 관리자 화면과 MCP 응답에 그대로 보이므로 영어로 쓴다.
 */
import { z } from 'zod'
import {
  MAX_PROJECT_TAGS,
  MAX_TAG_LENGTH,
  dedupeTags,
} from '@/lib/validations/project-tags'

/** 태그 이름. 쉼표·파이프(`|`)는 필터 구분자로 쓰이므로 막는다. */
const tagName = z
  .string()
  .trim()
  .min(1, 'Tag is required')
  .max(MAX_TAG_LENGTH, `Tags are at most ${MAX_TAG_LENGTH} characters`)
  .refine((tag) => !/[,|]/.test(tag), {
    message: 'Tags cannot contain commas or pipes',
  })

/** 프로젝트 입력. 두 언어 이름·설명·본문, 대표·본문 이미지, 참가자는 필수다. */
export const projectValidation = z.object({
  name: z.string().trim().nonempty('Name is required'),
  nameKo: z.string().trim().nonempty('Korean Name is required'),
  description: z.string().trim().nonempty('Description is required'),
  descriptionKo: z.string().trim().nonempty('Korean Description is required'),
  content: z.string().trim().nonempty('Content is required'),
  contentKo: z.string().trim().nonempty('Korean Content is required'),
  mainImage: z.string().trim().nonempty('Main Image is required'),
  contentImages: z
    .array(z.string().trim().min(1, 'Image URL is required'))
    .nonempty('Content Images is required'),
  participants: z
    .array(z.string().trim().min(1, 'Participant is required'))
    .nonempty('Participants is required')
    .refine((list) => new Set(list).size === list.length, {
      message: 'Participants must be unique.',
    }),
  generationId: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Generation must be a numeric id')
    .refine((id) => Number(id) >= 1, {
      message: 'Generation is required',
    }),
  repoUrl: z
    .string()
    .trim()
    .url('Repository URL must be a valid URL')
    .nullable(),
  demoUrl: z.string().trim().url('Demo URL must be a valid URL').nullable(),
  tags: z
    .array(tagName)
    .default([])
    .transform(dedupeTags)
    .refine((tags) => tags.length <= MAX_PROJECT_TAGS, {
      message: `Up to ${MAX_PROJECT_TAGS} tags`,
    }),
})
