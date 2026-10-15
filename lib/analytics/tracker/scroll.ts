/** 화면 아래쪽 끝이 문서의 몇 %까지 내려왔는지. 스크롤할 필요가 없는 짧은 문서는 끝까지 본 것으로 센다. */
export function scrollPercent(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number
): number {
  if (documentHeight <= viewportHeight) return 100
  const percent = Math.round(
    ((scrollY + viewportHeight) / documentHeight) * 100
  )
  return Math.min(100, Math.max(0, percent))
}
