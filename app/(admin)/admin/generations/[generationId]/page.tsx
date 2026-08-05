import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import GenerationActivityPeriod from '@/app/components/admin/generation-activity-period'
import { notFound } from 'next/navigation'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { auth } from '@/auth'
import DataDeleteButton from '@/app/components/admin/data-delete-button'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const { generationId } = await params
  // generation 데이터 가져오기
  const generationData = await getGeneration(Number(generationId))

  return {
    title: `Generation: ${generationData?.name}`,
  }
}

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ generationId: string }>
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { generationId } = await params
  // generation 데이터 가져오기
  const generationData = await getGeneration(Number(generationId))
  // generation 데이터가 없을 경우 404 페이지로 이동
  if (!generationData) {
    notFound()
  }
  // 사용자 권한 가져오기
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/generations'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.generations}</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>
          {t.generation}: {generationData.name}
        </div>
        <DataEditLink
          session={session}
          dataType={'generations'}
          href={localizeAdminHref(
            `/admin/generations/${generationId}/edit`,
            locale
          )}
        />
        <DataDeleteButton
          session={session}
          dataType={'generations'}
          dataId={generationId}
        />
      </div>
      <div
        className={
          'mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }
      >
        <div className={'admin-card sm:col-span-2'}>
          <div className={'admin-field-label'}>{t.activityPeriod}</div>
          <GenerationActivityPeriod
            className={'admin-field-value flex items-center gap-2'}
            startDate={generationData.startDate}
            endDate={generationData.endDate}
          />
        </div>
        <div className={'admin-form-grid-full flex flex-col gap-2 py-4'}>
          <div className={'admin-field-label'}>{t.parts}</div>
          <div
            className={
              'grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }
          >
            {generationData.parts.map((part) => (
              <div key={part.id} className={'admin-card'}>
                <div className={'admin-field-value'}>{part.name}</div>
                <div>
                  {t.member}: {part.usersToParts.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
