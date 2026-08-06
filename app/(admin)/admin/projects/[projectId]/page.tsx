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
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'

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

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
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
        <p className={'text-lg'}>{t.projects}</p>
      </AdminNavigationButton>
      <div className={'flex flex-col gap-2 md:flex-row'}>
        <div className={'flex items-center gap-2'}>
          <div className={'admin-title'}>{projectData.name}</div>
          <DataEditLink
            session={session}
            dataOwnerId={projectData.authorId}
            dataType={'projects'}
            href={localizeAdminHref(
              `/admin/projects/${projectId}/edit`,
              locale
            )}
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
            rel={'noreferrer noopener'}
            className={'bg-primary rounded-lg p-1 px-3 text-sm text-white'}
          >
            {t.viewPublishedKo}
          </Link>
          <Link
            href={`/en/project/${projectData.generation.name}/${projectId}`}
            target={'_blank'}
            rel={'noreferrer noopener'}
            className={'bg-primary rounded-lg p-1 px-3 text-sm text-white'}
          >
            {t.viewPublishedEn}
          </Link>
        </div>
      </div>
      <div className={'admin-form-grid gap-2'}>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.generation}</div>
          <div className={'admin-field-value'}>
            {projectData.generation?.name}
          </div>
        </div>
        <div className={'admin-form-grid-full'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.nameEn}</div>
                <div className={'admin-field-value'}>{projectData.name}</div>
              </div>
            }
            koContent={
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.nameKo}</div>
                <div className={'admin-field-value'}>{projectData.nameKo}</div>
              </div>
            }
          />
        </div>
        <div className={'admin-form-grid-full'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.descriptionEn}</div>
                <div className={'admin-field-value'}>
                  {projectData.description}
                </div>
              </div>
            }
            koContent={
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.descriptionKo}</div>
                <div className={'admin-field-value'}>
                  {projectData.descriptionKo}
                </div>
              </div>
            }
          />
        </div>

        <div className={'admin-form-grid-full'}>
          <div className={'admin-field-label'}>{t.participants}</div>
          <div className={'admin-form-grid gap-2'}>
            {projectData.usersToProjects.map((user) => (
              <div key={user.user.id} className={'admin-card'}>
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
            'admin-form-grid-full grid grid-cols-1 gap-2 sm:grid-cols-2'
          }
        >
          <div className={'mx-auto flex w-full max-w-lg flex-col gap-2'}>
            <div className={'admin-field-label'}>{t.mainImage}</div>
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
            <div className={'admin-field-label'}>{t.contentImages}</div>
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
        <div className={'admin-form-grid-full py-8'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div className={'prose w-full max-w-none'}>
                <div className={'admin-field-label'}>{t.contentEn}</div>
                <SafeMDX source={projectData.content} />
              </div>
            }
            koContent={
              <div className={'prose w-full max-w-none'}>
                <div className={'admin-field-label'}>{t.contentKo}</div>
                <SafeMDX source={projectData.contentKo} />
              </div>
            }
          />
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
