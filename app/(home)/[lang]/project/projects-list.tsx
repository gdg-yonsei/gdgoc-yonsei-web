'use client'

import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import { getProjects } from '@/lib/server/fetcher/get-projects'
import Image from 'next/image'
import Link from 'next/link'
import formatDateYYYYMMDD from '@/lib/format-date-yyyy-mm-dd'

export default function ProjectsList({
  projectsData,
  lang,
}: {
  projectsData: Awaited<ReturnType<typeof getProjects>>
  lang: string
}) {
  const [generation] = useAtom(generationState)

  const projects = projectsData.filter(
    (data) => data?.generation?.name === generation
  )

  return (
    <div
      className={
        'mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3'
      }
    >
      {projects.map((data, i) => (
        <Link
          href={`/projects/${data?.id}`}
          key={i}
          className={'ring-gdg-white rounded-lg bg-white ring-2'}
        >
          <Image
            src={data?.mainImage}
            width={200}
            height={200}
            alt={data?.name}
            className={'aspect-3/2 w-full rounded-t-lg object-cover'}
          />
          <div className={'p-3'}>
            <h2 className={'pb-2 text-2xl font-semibold'}>
              {lang === 'ko' ? data?.nameKo : data?.name}
            </h2>
            <p className={'text-sm'}>
              {formatDateYYYYMMDD(new Date(data?.updatedAt))}
            </p>
            <p className={'text-sm'}>{data?.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
