// 웹 폼·MCP 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'
import { isHttpUrl } from '@/lib/safe-url'
import {
  MAX_BODY_LENGTH,
  MAX_ID_LENGTH,
  MAX_IMAGES,
  MAX_PEOPLE,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_URL_LENGTH,
} from '@/lib/validations/limits'
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

// 공개 페이지의 href가 되므로 http(s)만 받는다. `javascript:`도 URL 형식으로는 유효하다.
const webUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(MAX_URL_LENGTH, `${label} is too long`)
    .url(`${label} must be a valid URL`)
    .refine(isHttpUrl, `${label} must start with http:// or https://`)
    .nullable()

export const projectValidation = z.object({
  name: z
    .string()
    .trim()
    .nonempty('Name is required')
    .max(MAX_TITLE_LENGTH, 'Name is too long'),
  nameKo: z
    .string()
    .trim()
    .nonempty('Korean Name is required')
    .max(MAX_TITLE_LENGTH, 'Korean Name is too long'),
  description: z
    .string()
    .trim()
    .nonempty('Description is required')
    .max(MAX_SUMMARY_LENGTH, 'Description is too long'),
  descriptionKo: z
    .string()
    .trim()
    .nonempty('Korean Description is required')
    .max(MAX_SUMMARY_LENGTH, 'Korean Description is too long'),
  content: z
    .string()
    .trim()
    .nonempty('Content is required')
    .max(MAX_BODY_LENGTH, 'Content is too long'),
  contentKo: z
    .string()
    .trim()
    .nonempty('Korean Content is required')
    .max(MAX_BODY_LENGTH, 'Korean Content is too long'),
  mainImage: z
    .string()
    .trim()
    .nonempty('Main Image is required')
    .max(MAX_URL_LENGTH, 'Main Image URL is too long'),
  contentImages: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Image URL is required')
        .max(MAX_URL_LENGTH, 'Image URL is too long')
    )
    .nonempty('Content Images is required')
    .max(MAX_IMAGES, `Up to ${MAX_IMAGES} content images`),
  participants: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Participant is required')
        .max(MAX_ID_LENGTH, 'Invalid participant')
    )
    .nonempty('Participants is required')
    .max(MAX_PEOPLE, `Up to ${MAX_PEOPLE} participants`)
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
  repoUrl: webUrl('Repository URL'),
  demoUrl: webUrl('Demo URL'),
  tags: z
    .array(tagName)
    .default([])
    .transform(dedupeTags)
    .refine((tags) => tags.length <= MAX_PROJECT_TAGS, {
      message: `Up to ${MAX_PROJECT_TAGS} tags`,
    }),
})
