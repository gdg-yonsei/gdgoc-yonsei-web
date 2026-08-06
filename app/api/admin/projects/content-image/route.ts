import { createMultipleImageUploadRoute } from '@/lib/server/image-upload-route'

const handlers = createMultipleImageUploadRoute({ resource: 'projects' })

export const POST = handlers.POST
