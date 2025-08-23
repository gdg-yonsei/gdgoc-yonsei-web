import Link from 'next/link'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import './globals.css'
import type { Metadata } from 'next'
import localFont from 'next/font/local'

export const metadata: Metadata = {
  title: '404 Not Found | GDGoC Yonsei',
  description: 'Google Developer Group on Campus Yonsei University',
}

const googleSans = localFont({
  src: './fonts/google-sans.woff2',
  display: 'swap',
  variable: '--font-sans',
  weight: '100 900',
})

/**
 * 404 Not Found Page
 * @constructor
 */
export default function NotFound() {
  return (
    <html className={`text-gdg-black bg-neutral-50 ${googleSans.className}`}>
      <body>
        <div className={'flex h-screen w-full items-center justify-center p-4'}>
          <div className={'flex flex-col gap-4'}>
            <GDGoCYonseiLogo />
            <h1 className={'text-5xl font-bold md:text-6xl'}>404 Not Found</h1>
            <Link href={'/'} className={'text-2xl font-semibold underline'}>
              Back to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
