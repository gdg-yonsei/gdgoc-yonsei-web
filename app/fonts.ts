import {
  Google_Sans,
  Google_Sans_Code,
  Google_Sans_Flex,
} from 'next/font/google'

/**
 * Latin text and display face. The ROND (roundness) axis lets display type
 * echo the capsule strokes of the GDG mark; with weight it is ~71 KB (latin),
 * versus ~52 KB for the old static Google Sans file.
 */
export const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin'],
  axes: ['ROND'],
  display: 'swap',
  variable: '--font-flex',
  // next/font has no metrics for this family; the metric-matched fallback
  // face lives in app/styles/site-theme.css so swapping never reflows text.
  adjustFontFallback: false,
  fallback: ['Google Sans Flex Fallback'],
})

/**
 * The home hero's "GDGoC Yonsei" title. Only the bold Latin face is needed.
 * There are no fallback metrics for this family either, so the title falls
 * back to the display stack (Google Sans Flex, already loaded) while it swaps.
 */
export const googleSans = Google_Sans({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--font-google-sans',
  adjustFontFallback: false,
})

/** Dates, tags and counters. Not preloaded: it only sets small meta text. */
export const googleSansCode = Google_Sans_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-code-mono',
  preload: false,
  adjustFontFallback: false,
  fallback: ['Google Sans Code Fallback'],
})
