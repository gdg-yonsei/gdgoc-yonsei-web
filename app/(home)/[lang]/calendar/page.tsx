'use client'

import PageTitle from '@/app/components/page-title'
import { useState } from 'react'

export default function CalendarPage() {
  const [loading, setLoading] = useState<boolean>(true)

  return (
    <div className={'flex min-h-screen w-full flex-col py-20'}>
      <PageTitle>Calendar</PageTitle>
      {loading ? (
        <div className={'mx-auto w-full max-w-4xl px-4'}>
          <div
            className={
              'aspect-square animate-pulse rounded-xl bg-neutral-200 md:aspect-3/2'
            }
          />
        </div>
      ) : (
        <iframe
          src="https://calendar.google.com/calendar/embed?src=677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c%40group.calendar.google.com&ctz=Asia%2FSeoul"
          className={
            'mx-auto aspect-square w-full max-w-4xl rounded-xl px-4 md:aspect-3/2'
          }
        ></iframe>
      )}
      <iframe
        src="https://calendar.google.com/calendar/embed?src=677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c%40group.calendar.google.com&ctz=Asia%2FSeoul"
        className={'hidden'}
        onLoad={() => setLoading(false)}
      ></iframe>
    </div>
  )
}
