'use server'
import { auth } from '@/auth'
import checkPermission from '@/lib/server/permission/check-permission'

export async function registerSessionAction(
  prev: { error: string },
  formData: FormData
) {
  const session = await auth()
  // TODO Complete register session action
  return { error: '' }
}
