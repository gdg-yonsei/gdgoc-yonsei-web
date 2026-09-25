/**
 * Calls `ready` once with the first element matching `selector` inside
 * `root`: right away when it is already there, otherwise as soon as it
 * streams in (a Suspense boundary resolving). Returns a function that stops
 * waiting.
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
