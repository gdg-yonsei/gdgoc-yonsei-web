import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { auth } from '@/auth'
import { getPart } from '@/lib/server/fetcher/admin/get-part'
import formatUserName from '@/lib/format-user-name'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import DataDeleteButton from '@/app/components/admin/data-delete-button'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partId: string }>
}): Promise<Metadata> {
  const { partId } = await params
  // Part 데이터 가져오기
  const partData = await getPart(Number(partId))

  return {
    title: `Part: ${partData?.name}`,
  }
}

export default async function PartPage({
  params,
}: {
  params: Promise<{ partId: string }>
}) {
  const { partId } = await params
  // Part 데이터 가져오기
  const partData = await getPart(Number(partId))
  // Part 데이터가 없으면 404 페이지 표시
  if (!partData) {
    notFound()
  }

  // 기수 데이터 가져오기
  const generationData = partData.generationsId
    ? await getGeneration(partData.generationsId)
    : null
  // 사용자 로그인 정보
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/parts'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Parts</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>{partData.name}</div>
        <DataEditLink
          session={session}
          dataId={partId}
          dataType={'parts'}
          href={`/admin/parts/${partId}/edit`}
        />
        <DataDeleteButton
          session={session}
          dataType={'parts'}
          dataId={partId}
        />
      </div>
      <div className={'member-data-grid gap-2'}>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Generation</div>
          <div className={'member-data-content'}>{generationData?.name}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Description</div>
          <div className={'member-data-content'}>{partData.description}</div>
        </div>
        <div className={'col-span-4'}>
          <div className={'member-data-title'}>Members</div>
          <div className={'member-data-grid gap-2'}>
            {partData.usersToParts
              .filter((userToPart) => userToPart.userType === 'Primary')
              .map((user) => (
                <div key={user.user.id} className={'member-data-box'}>
                  <div className={'member-data-content'}>
                    {user.user.firstNameKo
                      ? formatUserName(
                          user.user.name,
                          user.user.firstNameKo,
                          user.user.lastNameKo,
                          user.user.isForeigner,
                          !user.user.isForeigner
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
        <div className={'col-span-4'}>
          <div className={'member-data-title'}>Double Board Members</div>
          <div className={'member-data-grid gap-2'}>
            {partData.usersToParts
              .filter((userToPart) => userToPart.userType === 'Secondary')
              .map((user) => (
                <div key={user.user.id} className={'member-data-box'}>
                  <div className={'member-data-content'}>
                    {user.user.firstNameKo
                      ? formatUserName(
                          user.user.name,
                          user.user.firstNameKo,
                          user.user.lastNameKo,
                          user.user.isForeigner,
                          !user.user.isForeigner
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
      </div>
    </AdminDefaultLayout>
  )
}
