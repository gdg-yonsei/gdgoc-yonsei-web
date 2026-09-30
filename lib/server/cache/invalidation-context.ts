import 'server-only'

import { AsyncLocalStorage } from 'node:async_hooks'

const storage = new AsyncLocalStorage<{ routeHandler: true }>()

/**
 * Next 16 의 updateTag 는 Server Action 에서만 호출할 수 있다.
 * MCP 같은 Route Handler 는 이 컨텍스트 안에서 서비스를 실행해
 * 무효화가 revalidateTag(tag, { expire: 0 }) 로 전환되게 한다.
 */
export function runWithRouteHandlerInvalidation<T>(
  fn: () => Promise<T>
): Promise<T> {
  return storage.run({ routeHandler: true }, fn)
}

export function isRouteHandlerInvalidation(): boolean {
  return storage.getStore()?.routeHandler === true
}
