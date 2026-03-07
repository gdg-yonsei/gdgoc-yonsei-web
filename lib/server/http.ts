import 'server-only'

import { NextResponse } from 'next/server'

const privateNoStoreHeaders = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  Vary: 'Cookie, Authorization',
} as const

export function privateJson(
  body: unknown,
  init?: ResponseInit
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...privateNoStoreHeaders,
      ...init?.headers,
    },
  })
}
