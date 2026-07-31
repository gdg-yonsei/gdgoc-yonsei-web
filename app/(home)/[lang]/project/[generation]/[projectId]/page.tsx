import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImageSliderGallery from '@/app/components/images-slider'
import formatUserName from '@/lib/format-user-name'
import SafeMDX from '@/app/components/safe-mdx'
import NavigationButton from '@/app/components/navigation-button'
import type { Metadata } from 'next'
import { getProjectById } from '@/lib/server/queries/public/projects'
import languageParamChecker from '@/lib/language-param-checker'
import {
  createLocalizedMetadata,
  getAbsoluteUrl,
  getLocalizedUrl,
  getSiteUrl,
  summarizeForMetadata,
} from '@/lib/seo/metadata'
import JsonLd from '@/app/components/json-ld'

// 이 라우트는 렌더링 전에 기수/상세 ID를 DB로 검증해 `notFound()`를 호출하므로,
// Suspense 경계 밖에서 캐시되지 않은 데이터(params, 검증 쿼리)에 접근합니다.
// cacheComponents 환경에서는 그런 접근이 프리렌더 오류이므로 blocking 라우트로 선언합니다.
// (`notFound()`는 noindex 404 페이지를 렌더링하지만, 셸이 이미 전송된 뒤라 상태 코드는 200입니다.)
export const unstable_instant = false

type Props = {
  params: Promise<{ projectId: string; lang: string; generation: string }>
}

/**
 * `generateMetadata` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`Props`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, generation, projectId } = await params
  const locale = languageParamChecker(lang)

  const projectData = await getProjectById(projectId, locale)

  if (!projectData || projectData.generation.name !== generation) {
    notFound()
  }

  const title =
    locale === 'ko' ? projectData.nameKo || projectData.name : projectData.name
  const fallbackDescription =
    locale === 'ko'
      ? `GDGoC Yonsei ${generation} 기수의 ${title} 프로젝트를 소개합니다.`
      : `Explore ${title}, a GDGoC Yonsei ${generation} student project.`
  const description = summarizeForMetadata(
    locale === 'ko' ? projectData.descriptionKo : projectData.description,
    fallbackDescription
  )

  return createLocalizedMetadata({
    locale,
    path: `/project/${generation}/${projectId}`,
    title,
    description,
    image: projectData.mainImage,
  })
}

/**
 * `ProjectPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`Props`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function ProjectPage({ params }: Props) {
  const { projectId, lang, generation } = await params
  const projectData = await getProjectById(
    projectId,
    lang === 'ko' ? 'ko' : 'en'
  )

  if (!projectData || projectData.generation.name !== generation) {
    return notFound()
  }

  const locale = lang === 'ko' ? 'ko' : 'en'
  const title =
    locale === 'ko' ? projectData.nameKo || projectData.name : projectData.name
  const description = summarizeForMetadata(
    locale === 'ko' ? projectData.descriptionKo : projectData.description,
    locale === 'ko'
      ? `GDGoC Yonsei ${generation} 기수의 ${title} 프로젝트를 소개합니다.`
      : `Explore ${title}, a GDGoC Yonsei ${generation} student project.`
  )
  const canonical = getLocalizedUrl(
    locale,
    `/project/${generation}/${projectId}`
  )
  const projectImages = [projectData.mainImage, ...projectData.images]
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${canonical}#creative-work`,
    url: canonical,
    name: title,
    description,
    image: projectImages.map(getAbsoluteUrl),
    inLanguage: locale,
    dateCreated: projectData.createdAt.toISOString(),
    dateModified: projectData.updatedAt.toISOString(),
    creator: projectData.usersToProjects.map(({ user }) => ({
      '@type': 'Person',
      name:
        locale === 'ko'
          ? formatUserName(
              user.name,
              user.firstNameKo,
              user.lastNameKo,
              user.isForeigner,
              true
            )
          : formatUserName(
              user.name,
              user.firstName,
              user.lastName,
              user.isForeigner
            ),
    })),
    publisher: { '@id': `${getSiteUrl()}#organization` },
  }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <JsonLd id="project-structured-data" data={structuredData} />
      <NavigationButton href={`/${lang}/project/${generation}`}>
        <p>{locale === 'ko' ? '프로젝트' : 'Projects'}</p>
      </NavigationButton>
      <PageTitle>{title}</PageTitle>
      <ImageSliderGallery images={projectImages} alt={title} />
      <div className={'flex flex-col gap-8 py-8'}>
        <div className={'flex flex-col'}>
          <div className={'border-gdg-white flex w-full border-b-2'}>
            <h2
              className={'mx-auto w-full max-w-4xl px-4 text-xl font-semibold'}
            >
              {lang === 'ko' ? '프로젝트 참여자' : 'Project Contributors'}
            </h2>
          </div>
          <div className={'mx-auto w-full max-w-4xl px-4'}>
            {projectData.usersToProjects.map((user, i) => (
              <div key={i} className={'flex items-center gap-1'}>
                <div>
                  {lang === 'ko'
                    ? formatUserName(
                        user.user.name,
                        user.user.firstNameKo,
                        user.user.lastNameKo,
                        user.user.isForeigner,
                        true
                      )
                    : formatUserName(
                        user.user.name,
                        user.user.firstName,
                        user.user.lastName,
                        user.user.isForeigner
                      )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={'flex flex-col'}>
          <div className={'border-gdg-white flex w-full border-b-2'}>
            <h2
              className={'mx-auto w-full max-w-4xl px-4 text-xl font-semibold'}
            >
              {lang === 'ko' ? '프로젝트 설명' : 'Project Content'}
            </h2>
          </div>
          <div className={'prose mx-auto w-full max-w-4xl p-4'}>
            <SafeMDX
              source={
                lang === 'ko' ? projectData.contentKo : projectData.content
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
