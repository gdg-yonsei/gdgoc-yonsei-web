/**
 * 관리자 API 라우트(이미지 업로드, 프로필 이미지, 공용 삭제) 요청 스키마.
 *
 * 입력 검증 스키마(zod). 서비스 계층이 웹 폼과 MCP 입력을 모두 이 스키마로 검증한다.
 * 오류 문구는 관리자 화면과 MCP 응답에 그대로 보이므로 영어로 쓴다.
 */
import { z } from 'zod'

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

/** `image/*` 형식의 MIME 타입. */
const imageMimeTypeSchema = z
  .string()
  .trim()
  .regex(/^image\/[a-z0-9.+-]+$/i, 'Invalid image mime type')

const imageUploadItemSchema = z.object({
  fileName: imageFileNameSchema,
  type: imageMimeTypeSchema,
})

/** 프로필 이미지 업로드 URL 요청(대상 멤버 ID 포함). */
export const memberProfileImageUploadValidation = imageUploadItemSchema.extend({
  memberId: z.string().trim().min(1, 'Member ID is required'),
})

/** 이미지 한 장 업로드 URL 요청. */
export const singleImageUploadValidation = imageUploadItemSchema

/** 여러 장 업로드 URL 요청(한 번에 최대 20장). */
export const multipleImageUploadValidation = z.object({
  images: z
    .array(imageUploadItemSchema)
    .min(1, 'At least one image is required')
    .max(20, 'Too many images requested at once'),
})

/** 업로드한 이미지 삭제 요청. */
export const imageDeleteValidation = z.object({
  imageUrl: z.string().trim().min(1, 'Image URL is required'),
})

/** 멤버 프로필 이미지 URL 저장 요청. */
export const updateMemberProfileImageValidation = z.object({
  profileImage: z.string().trim().min(1, 'Profile image is required'),
})

const deleteResourceTypeSchema = z.enum([
  'sessions',
  'projects',
  'generations',
  'parts',
])

/** 공용 삭제 버튼이 지울 수 있는 리소스 종류. */
export type DeleteResourceType = z.infer<typeof deleteResourceTypeSchema>

/** 공용 삭제 버튼 요청. 세션·프로젝트 ID는 UUID, 기수·파트 ID는 양의 정수여야 한다. */
export const deleteResourceValidation = z
  .object({
    dataType: deleteResourceTypeSchema,
    dataId: z.string().trim().min(1, 'Data ID not found'),
  })
  .superRefine(({ dataType, dataId }, ctx) => {
    if (dataType === 'sessions' || dataType === 'projects') {
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
