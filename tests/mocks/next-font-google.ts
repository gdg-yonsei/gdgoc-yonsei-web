// next/font only works inside the Next.js compiler; under Vitest each loader
// returns the same shape with empty class names.
const font = () => ({
  className: '',
  variable: '',
  style: { fontFamily: 'sans-serif' },
})

export const Google_Sans = font
export const Google_Sans_Code = font
export const Google_Sans_Flex = font
