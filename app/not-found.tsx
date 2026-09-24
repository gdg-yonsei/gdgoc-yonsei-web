import type { Metadata } from 'next'
import './globals.css'
import NotFoundView from '@/app/components/site/not-found-view'
import { googleSansCode, googleSansFlex } from '@/app/fonts'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  title: '404 Not Found | GDGoC Yonsei',
  description: 'Google Developer Group on Campus Yonsei University',
}

export default function NotFound() {
  return (
    <html
      lang="en"
      className={cn('site', googleSansFlex.variable, googleSansCode.variable)}
      data-color-scheme="auto"
    >
      <body className="bg-stage text-on-stage">
        <NotFoundView />
      </body>
    </html>
  )
}
