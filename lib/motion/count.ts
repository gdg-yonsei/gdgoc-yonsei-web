/** The number in a printed figure such as "2,100", or null if there is none. */
export function parseCount(text: string): number | null {
  const digits = text.replace(/[^\d.]/g, '')
  return digits ? Number(digits) : null
}

/** A whole number printed the way the landing copy prints figures. */
export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}
