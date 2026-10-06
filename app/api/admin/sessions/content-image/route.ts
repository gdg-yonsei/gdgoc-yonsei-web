import { createMultipleImageUploadRoute } from '@/lib/server/image-upload-route'

const handlers = createMultipleImageUploadRoute({ resource: 'sessions' })

export const POST = handlers.POST
