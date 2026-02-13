import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getProject } from '@/lib/server/fetcher/admin/get-project'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { auth } from '@/auth'
import SafeMDX from '@/app/components/safe-mdx'
import Image from 'next/image'
import formatUserName from '@/lib/format-user-name'
import DataDeleteButton from '@/app/components/admin/data-delete-button'
import Link from 'next/link'

/**
 * `generateMetadata` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  // Project 데이터 가져오기
  const projectData = await getProject(projectId)

  return {
    title: `Project: ${projectData?.name}`,
  }
}

/**
 * `ProjectPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  // Project 데이터 가져오기
  const projectData = await getProject(projectId)

  // Project 데이터가 없으면 404 페이지 표시
  if (!projectData) {
    notFound()
  }
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/projects'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Projects</p>
      </AdminNavigationButton>
      <div className={'flex flex-col gap-2 md:flex-row'}>
        <div className={'flex items-center gap-2'}>
          <div className={'admin-title'}>{projectData.name}</div>
          <DataEditLink
            session={session}
            dataOwnerId={projectData.authorId}
            dataType={'projects'}
            href={`/admin/projects/${projectId}/edit`}
          />
          <DataDeleteButton
            session={session}
            dataType={'projects'}
            dataId={projectId}
          />
        </div>
        <div className={'flex items-center justify-start gap-2'}>
          <Link
            href={`/ko/project/${projectData.generation.name}/${projectId}`}
            target={'_blank'}
            className={'rounded-lg bg-sky-700 p-1 px-3 text-sm text-white'}
          >
            View Published (KO)
          </Link>
          <Link
            href={`/en/project/${projectData.generation.name}/${projectId}`}
            target={'_blank'}
            className={'rounded-lg bg-sky-700 p-1 px-3 text-sm text-white'}
          >
            View Published (EN)
          </Link>
        </div>
      </div>
      <div className={'member-data-grid gap-2'}>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Generation</div>
          <div className={'member-data-content'}>
            {projectData.generation?.name}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Name (English)</div>
          <div className={'member-data-content'}>{projectData.name}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Name (Korean)</div>
          <div className={'member-data-content'}>{projectData.nameKo}</div>
        </div>

        <div className={'member-data-box col-span-1 md:col-span-2'}>
          <div className={'member-data-title'}>Description (English)</div>
          <div className={'member-data-content'}>{projectData.description}</div>
        </div>
        <div className={'member-data-box col-span-1 md:col-span-2'}>
          <div className={'member-data-title'}>Description (Korean)</div>
          <div className={'member-data-content'}>
            {projectData.descriptionKo}
          </div>
        </div>

        <div className={'member-data-col-span'}>
          <div className={'member-data-title'}>Participants</div>
          <div className={'member-data-grid gap-2'}>
            {projectData.usersToProjects.map((user) => (
              <div key={user.user.id} className={'member-data-box'}>
                {formatUserName(
                  user.user.name,
                  user.user.firstName,
                  user.user.lastName,
                  user.user.isForeigner
                )}
              </div>
            ))}
          </div>
        </div>
        <div
          className={
            'member-data-col-span grid grid-cols-1 gap-2 sm:grid-cols-2'
          }
        >
          <div className={'mx-auto flex w-full max-w-lg flex-col gap-2'}>
            <div className={'member-data-title'}>Main Image</div>
            <Image
              src={projectData.mainImage}
              alt={projectData.mainImage}
              width={600}
              height={400}
              className={'w-full'}
              placeholder={'blur'}
              blurDataURL={'/default-image.png'}
            />
          </div>
          <div className={'mx-auto flex w-full max-w-lg flex-col gap-2'}>
            <div className={'member-data-title'}>Content Images</div>
            {projectData.images.map((image, index) => (
              <Image
                key={index}
                src={image}
                alt={image}
                width={600}
                height={400}
                className={'w-full'}
                placeholder={'blur'}
                blurDataURL={'/default-image.png'}
              />
            ))}
          </div>
        </div>
        <div className={'prose member-data-col-span w-full py-8'}>
          <div className={'member-data-title'}>Content (English)</div>
          <SafeMDX source={projectData.content} />
        </div>
        <div className={'prose member-data-col-span w-full py-8'}>
          <div className={'member-data-title'}>Content (Korean)</div>
          <SafeMDX source={projectData.contentKo} />
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
