import { notFound } from 'next/navigation'
import PageTitle from '@/app/components/page-title'
import ImageSliderGallery from '@/app/components/images-slider'
import formatUserName from '@/lib/format-user-name'
import SafeMDX from '@/app/components/safe-mdx'
import NavigationButton from '@/app/components/navigation-button'
import type { Metadata } from 'next'
import { i18n } from '@/i18n-config'
import {
  getProjectById,
  getProjects,
} from '@/lib/server/queries/public/projects'

type Props = {
  params: Promise<{ projectId: string; lang: string; generation: string }>
}

/**
 * `generateStaticParams` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function generateStaticParams() {
  const projects = await getProjects(i18n.defaultLocale)
  const projectIdAndGenerationId = projects.map((project) => ({
    generation: project.generation.name,
    projectId: String(project.id),
  }))
  const langs = ['ko', 'en']
  const paramsList: { generation: string; projectId: string; lang: string }[] =
    []
  for (const lang of langs) {
    for (const projectAndGeneration of projectIdAndGenerationId) {
      paramsList.push({
        ...projectAndGeneration,
        lang: lang,
      })
    }
  }
  return paramsList
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

  const projectData = await getProjectById(projectId, lang === 'ko' ? 'ko' : 'en')

  if (!projectData) {
    if (lang === 'ko') {
      return {
        title: `${generation} 프로젝트`,
        description: `GDGoC Yonsei ${generation} 프로젝트`,
      }
    } else {
      return {
        title: `${generation} Projects`,
        description: `GDGoC Yonsei ${generation} Projects`,
      }
    }
  }

  if (lang === 'ko') {
    return {
      title: `${projectData.nameKo}`,
      description: `${projectData.descriptionKo}`,
    }
  }

  return {
    title: `${projectData.name}`,
    description: `${projectData.description}`,
  }
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
  const projectData = await getProjectById(projectId, lang === 'ko' ? 'ko' : 'en')

  if (!projectData) {
    return notFound()
  }

  return (
    <div className={'min-h-screen w-full pt-20'}>
      <NavigationButton href={`/${lang}/project/${generation}`}>
        <p>Projects</p>
      </NavigationButton>
      <PageTitle>
        {lang === 'ko' ? projectData.nameKo : projectData.name}
      </PageTitle>
      <ImageSliderGallery
        images={[projectData.mainImage, ...projectData.images]}
      />
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
