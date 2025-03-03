import { getSession } from '@/lib/fetcher/get-session'
import { notFound } from 'next/navigation'

export default function SessionPageContent({
  sessionData,
}: {
  sessionData: Awaited<ReturnType<typeof getSession>>
}) {
  if (!sessionData) {
    return notFound()
  }

  return (
    <div>
      <div>{sessionData.name}</div>
    </div>
  )
}
