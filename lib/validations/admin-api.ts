import { z } from 'zod'

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

const imageMimeTypeSchema = z
  .string()
  .trim()
  .regex(/^image\/[a-z0-9.+-]+$/i, 'Invalid image mime type')

const imageUploadItemSchema = z.object({
  fileName: imageFileNameSchema,
  type: imageMimeTypeSchema,
})

export const memberProfileImageUploadValidation = imageUploadItemSchema.extend({
  memberId: z.string().trim().min(1, 'Member ID is required'),
})

export const singleImageUploadValidation = imageUploadItemSchema

export const multipleImageUploadValidation = z.object({
  images: z
    .array(imageUploadItemSchema)
    .min(1, 'At least one image is required')
    .max(20, 'Too many images requested at once'),
})

export const imageDeleteValidation = z.object({
  imageUrl: z.string().trim().min(1, 'Image URL is required'),
})

export const updateMemberProfileImageValidation = z.object({
  profileImage: z.string().trim().min(1, 'Profile image is required'),
})

const deleteResourceTypeSchema = z.enum([
  'sessions',
  'projects',
  'generations',
  'parts',
])

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
