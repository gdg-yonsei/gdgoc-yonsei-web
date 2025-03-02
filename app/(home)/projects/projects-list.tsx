'use client'

import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import { getProjects } from '@/lib/fetcher/get-projects'
import Image from 'next/image'
import Link from 'next/link'

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/-/g, '.')
}

export default function ProjectsList({
  projectsData,
}: {
  projectsData: Awaited<ReturnType<typeof getProjects>>
}) {
  const [generation] = useAtom(generationState)

  const projects = projectsData.filter(
    (data) => data.generation.name === generation
  )

  return (
    <div className={'flex w-full flex-col gap-2 p-4'}>
      {projects.map((data, i) => (
        <Link
          href={`/projects/${data.id}`}
          key={i}
          className={'bg-white rounded-2xl'}
        >
          <Image
            src={data.mainImage}
            width={200}
            height={200}
            alt={data.name}
            className={'w-full rounded-t-2xl'}
          />
          <div className={'p-2'}>
            <h2 className={'text-xl font-semibold'}>{data.name}</h2>
            <p>{formatDate(new Date(data.updatedAt))}</p>
            <p>{data.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
