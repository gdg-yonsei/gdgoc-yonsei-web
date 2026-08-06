import { createSingleImageUploadRoute } from '@/lib/server/image-upload-route'

const handlers = createSingleImageUploadRoute({ resource: 'projects' })

export const POST = handlers.POST
export const DELETE = handlers.DELETE
