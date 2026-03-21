import 'server-only'

import { normalizeError } from '@/lib/server/errors'

export function jsonOk<T>(data: T) {
  return Response.json({ success: true, data } as const, { status: 200 })
}

export function jsonError(error: string, status = 400) {
  return Response.json({ success: false, error } as const, { status })
}

export function withErrorHandler(
  handler: (
    request: Request,
    context: { params: Promise<Record<string, string>> }
  ) => Promise<Response>
) {
  return async (
    request: Request,
    context: { params: Promise<Record<string, string>> }
  ): Promise<Response> => {
    try {
      return await handler(request, context)
    } catch (err) {
      const normalized = normalizeError(err)
      console.error(`[API Error] ${request.method} ${request.url}:`, normalized)
      return jsonError(normalized.message, 500)
    }
  }
}
