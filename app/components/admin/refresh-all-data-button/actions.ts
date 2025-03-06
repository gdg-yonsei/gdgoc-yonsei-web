'use server'

import { revalidateTag } from 'next/cache'

export default async function refresh() {
  console.log('Refresh All Data')
  revalidateTag('generations')
  revalidateTag('parts')
  revalidateTag('projects')
  revalidateTag('members')
  revalidateTag('sessions')
}
