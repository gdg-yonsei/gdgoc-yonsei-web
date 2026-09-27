import { z } from 'zod'
import { defineTool } from '@/lib/mcp/registry'
import {
  IMAGE_TARGETS,
  MAX_IMAGE_UPLOAD_BYTES,
  completeImageUpload,
  createImageUpload,
  importImageFromUrl,
} from '@/lib/server/services/admin/images'

const target = z
  .enum(IMAGE_TARGETS)
  .describe(
    'Where the image will be used: "sessions", "projects", or "users" (profile images).'
  )

// 업로드는 쓰기 권한이 있는 곳이 하나라도 있으면 보인다(대상별 권한은 서비스가 확인).
const gate = [
  { action: 'post', resource: 'sessions' },
  { action: 'post', resource: 'projects' },
  { action: 'put', resource: 'members' },
] as const

const uploadedKey = (data: unknown) =>
  (data as { objectKey?: string } | null)?.objectKey

export const imageTools = [
  defineTool({
    name: 'create_image_upload',
    title: 'Start an image upload',
    description:
      'For clients that can run shell commands. Returns a presigned PUT URL valid for 15 minutes; upload the file there with exactly the returned headers (see curlExample), then call complete_image_upload. Up to 200MB; jpg, jpeg, png, webp, gif or avif (no SVG).',
    scope: 'gyms:write',
    gate: [...gate],
    input: z.object({
      target,
      fileName: z.string().describe('Original file name with extension.'),
      mimeType: z
        .enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
        .describe('Must match the file extension.'),
      sizeBytes: z
        .number()
        .int()
        .min(1)
        .max(MAX_IMAGE_UPLOAD_BYTES)
        .describe('Exact file size in bytes (max 209715200 = 200MB).'),
    }),
    run: (actor, input) => createImageUpload(actor, input),
    targetId: uploadedKey,
  }),
  defineTool({
    name: 'complete_image_upload',
    title: 'Finish an image upload',
    description:
      'Verifies the uploaded object (size and real image bytes) and returns its public URL for mainImage/contentImages/profileImage. Invalid files are deleted.',
    scope: 'gyms:write',
    gate: [...gate],
    input: z.object({
      objectKey: z.string().describe('objectKey from create_image_upload.'),
    }),
    run: (actor, input) => completeImageUpload(actor, input),
    targetId: uploadedKey,
  }),
  defineTool({
    name: 'import_image_from_url',
    title: 'Import an image from a URL',
    description:
      'For clients without a shell. The server downloads a public https image (up to 200MB; jpg, png, webp, gif or avif) into storage and returns its URL. Private or internal addresses are refused.',
    scope: 'gyms:write',
    gate: [...gate],
    input: z.object({
      target,
      url: z
        .string()
        .url()
        .refine((value) => value.startsWith('https://'), 'Only https URLs are allowed.'),
    }),
    run: (actor, input) => importImageFromUrl(actor, input),
    targetId: uploadedKey,
  }),
]
