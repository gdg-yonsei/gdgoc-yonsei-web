import 'server-only'

import { AsyncLocalStorage } from 'node:async_hooks'

const storage = new AsyncLocalStorage<{ routeHandler: true }>()

// updateTag는 Action 전용이다. Handler는 이 컨텍스트에서 revalidateTag(tag, { expire: 0 })를 쓴다.
export function runWithRouteHandlerInvalidation<T>(
  fn: () => Promise<T>
): Promise<T> {
  return storage.run({ routeHandler: true }, fn)
}

export function isRouteHandlerInvalidation(): boolean {
  return storage.getStore()?.routeHandler === true
}
