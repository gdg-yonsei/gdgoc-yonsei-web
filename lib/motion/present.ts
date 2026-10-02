/**
 * 스트리밍으로 나중에 도착하는 요소를 기다리는 헬퍼.
 */

/**
 * `root` 안에서 `selector`에 맞는 첫 요소로 `ready`를 한 번 부른다. 이미 있으면 바로,
 * 아니면 스트리밍으로 들어오는 순간(Suspense 경계가 풀릴 때) 부른다.
 * 기다리기를 멈추는 함수를 돌려준다.
 */
export function whenPresent<T extends Element = HTMLElement>(
  root: ParentNode & Node,
  selector: string,
  ready: (element: T) => void
): () => void {
  const found = root.querySelector<T>(selector)
  if (found) {
    ready(found)
    return () => {}
  }

  const observer = new MutationObserver(() => {
    const element = root.querySelector<T>(selector)
    if (!element) return
    observer.disconnect()
    ready(element)
  })
  observer.observe(root, { childList: true, subtree: true })
  return () => observer.disconnect()
}
