'use client'

import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import { getProjects } from '@/lib/fetcher/get-projects'
import Image from 'next/image'
import Link from 'next/link'
import formatDateYYYYMMDD from '@/lib/format-date-yyyy-mm-dd'

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
    <div className={'w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 p-4'}>
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
            <p>{formatDateYYYYMMDD(new Date(data.updatedAt))}</p>
            <p>{data.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
