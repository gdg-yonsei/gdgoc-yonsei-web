import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import formatDateYYYYMMDD from '@/lib/format-date-yyyy-mm-dd'
import db from '@/db'
import { eq } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import PageTitle from '@/app/components/page-title'
import StageButtonGroup from '@/app/components/stage-button-group'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Discover innovative projects by GDGoC Yonsei, where developers collaborate to build impactful solutions using cutting-edge technologies. Explore our work and get inspired!',
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: string; generation: string }>
}) {
  const paramsData = await params

  const generationData = await db.query.generations.findFirst({
    where: eq(generations.name, paramsData.generation),
    with: {
      projects: true,
    },
  })

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <PageTitle>
        {paramsData.lang === 'ko' ? '프로젝트' : 'Projects'}
      </PageTitle>
      <StageButtonGroup
        basePath={'project'}
        generation={paramsData.generation}
        lang={paramsData.lang}
      />
      <div
        className={
          'mx-auto grid w-full max-w-4xl grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3'
        }
      >
        {generationData?.projects.length === 0 && (
          <p>
            {paramsData.lang === 'ko'
              ? '해당 기수에서 프로젝트를 찾을 수 없습니다.'
              : 'There are no projects for this generation'}
          </p>
        )}
        {generationData?.projects.map((data, i) => (
          <Link
            href={`/${paramsData.lang}/project/${paramsData.generation}/${data?.id}`}
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
                {paramsData.lang === 'ko' ? data?.nameKo : data?.name}
              </h2>
              <p className={'text-sm'}>
                {formatDateYYYYMMDD(new Date(data?.updatedAt))}
              </p>
              <p className={'text-sm'}>{data?.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
