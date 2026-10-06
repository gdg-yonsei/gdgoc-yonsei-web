// Suspense 스트리밍으로 요소가 도착하면 ready를 한 번 호출한다. 이미 있으면 즉시 호출한다.
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
