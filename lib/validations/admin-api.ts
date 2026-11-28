// 웹 폼·MCP 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'
import { MAX_IMAGE_UPLOAD_BYTES } from '@/lib/upload-limits'

/** 업로드할 파일 이름. 경로 구분자·널 문자를 막고 확장자를 요구한다. */
const imageFileNameSchema = z
  .string()
  .trim()
  .min(1, 'File name is required')
  .max(255, 'File name is too long')
  .regex(/^[^\\/\0]+$/, 'Invalid file name')
  .refine((value) => {
    const extension = value.split('.').pop()
    return Boolean(extension && extension !== value)
  }, 'File extension is required')

// 허용 형식(jpg, png, webp, gif, avif)과 확장자 일치 여부는 업로드 서비스가 확인한다.
const imageMimeTypeSchema = z
  .string()
  .trim()
  .max(64, 'Invalid image mime type')
  .regex(/^image\/[a-z0-9.+-]+$/i, 'Invalid image mime type')

// 크기는 사전 서명 URL에 서명되어 R2가 그 크기의 본문만 받는다.
const imageSizeSchema = z
  .number({ message: 'Image size is required' })
  .int('Image size must be a whole number of bytes')
  .min(1, 'Image is empty')
  .max(MAX_IMAGE_UPLOAD_BYTES, 'Image exceeds the 200MB limit')

const imageUploadItemSchema = z.object({
  fileName: imageFileNameSchema,
  type: imageMimeTypeSchema,
  size: imageSizeSchema,
})

export const memberProfileImageUploadValidation = imageUploadItemSchema.extend({
  memberId: z
    .string()
    .trim()
    .min(1, 'Member ID is required')
    .max(128, 'Invalid member ID'),
})

export const singleImageUploadValidation = imageUploadItemSchema

/** 여러 장 업로드 URL 요청(한 번에 최대 20장). */
export const multipleImageUploadValidation = z.object({
  images: z
    .array(imageUploadItemSchema)
    .min(1, 'At least one image is required')
    .max(20, 'Too many images requested at once'),
})

export const updateMemberProfileImageValidation = z.object({
  profileImage: z
    .string()
    .trim()
    .min(1, 'Profile image is required')
    .max(2048, 'Profile image URL is too long'),
})

const deleteResourceTypeSchema = z.enum([
  'sessions',
  'projects',
  'generations',
  'parts',
  'announcements',
])

export type DeleteResourceType = z.infer<typeof deleteResourceTypeSchema>

/** 공용 삭제 버튼 요청. 세션·프로젝트·공지 ID는 UUID, 기수·파트 ID는 양의 정수여야 한다. */
export const deleteResourceValidation = z
  .object({
    dataType: deleteResourceTypeSchema,
    dataId: z
      .string()
      .trim()
      .min(1, 'Data ID not found')
      .max(64, 'Invalid data id format'),
  })
  .superRefine(({ dataType, dataId }, ctx) => {
    if (
      dataType === 'sessions' ||
      dataType === 'projects' ||
      dataType === 'announcements'
    ) {
      if (!z.string().uuid().safeParse(dataId).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid data id format',
          path: ['dataId'],
        })
      }
      return
    }

    if (!/^\d+$/.test(dataId) || Number(dataId) < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid data id format',
        path: ['dataId'],
      })
    }
  })
