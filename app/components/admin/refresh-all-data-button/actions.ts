'use server'

import { revalidateCache } from '@/lib/server/cache'

export default async function refresh() {
  console.log('Refresh All Data')
  revalidateCache(['generations', 'parts', 'projects', 'members', 'sessions'])
}
