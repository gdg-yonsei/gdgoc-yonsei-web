/** "2,100" 같은 표기에서 숫자를 꺼낸다. 숫자가 없으면 null. */
export function parseCount(text: string): number | null {
  const digits = text.replace(/[^\d.]/g, '')
  return digits ? Number(digits) : null
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}
