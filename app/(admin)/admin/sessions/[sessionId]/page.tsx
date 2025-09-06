import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import Image from 'next/image'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import DataEditLink from '@/app/components/admin/data-edit-link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import formatUserName from '@/lib/format-user-name'
import DataDeleteButton from '@/app/components/admin/data-delete-button'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>
}): Promise<Metadata> {
  const { sessionId } = await params
  // Session 데이터 가져오기
  const sessionData = await getSession(sessionId)

  return {
    title: `Session: ${sessionData?.name}`,
  }
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  // Session 데이터 가져오기
  const sessionData = await getSession(sessionId)

  // Session 데이터가 없으면 404 페이지 표시
  if (!sessionData) {
    notFound()
  }

  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/sessions'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Sessions</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>{sessionData.name}</div>
        <DataEditLink
          session={session}
          dataId={sessionId}
          dataType={'sessions'}
          href={`/admin/sessions/${sessionId}/edit`}
        />
        <DataDeleteButton
          session={session}
          dataType={'sessions'}
          dataId={sessionId}
        />
      </div>
      <div className={'member-data-grid gap-2'}>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Name</div>
          <div className={'member-data-content'}>{sessionData.name}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Name (Korean)</div>
          <div className={'member-data-content'}>{sessionData.nameKo}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Description</div>
          <div className={'member-data-content'}>{sessionData.description}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Description (Korean)</div>
          <div className={'member-data-content'}>
            {sessionData.descriptionKo}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Part</div>
          <div className={'member-data-content'}>{sessionData.part.name}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Max Capacity</div>
          <div className={'member-data-content'}>{sessionData.maxCapacity}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Author</div>
          <div className={'member-data-content'}>
            {formatUserName(
              sessionData.author?.name,
              sessionData.author?.firstName,
              sessionData.author?.lastName,
              sessionData.author?.isForeigner
            )}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>
            Participants {sessionData.userToSession.length}/
            {sessionData.maxCapacity}
          </div>
          <div className={'member-data-content max-h-48 overflow-y-auto'}>
            {sessionData.userToSession.map((user) => (
              <div key={user.userId}>
                {user.user.firstNameKo
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
            ))}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Internal Open</div>
          <div className={'member-data-content'}>
            {sessionData.internalOpen ? 'True' : 'False'}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Public Open</div>
          <div className={'member-data-content'}>
            {sessionData.publicOpen ? 'True' : 'False'}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Start Time</div>
          <div className={'member-data-content'}>
            {sessionData?.startAt
              ? new Intl.DateTimeFormat('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  hour: 'numeric',
                  minute: 'numeric',
                  day: 'numeric',
                }).format(new Date(sessionData.startAt))
              : 'TBD'}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>End Time</div>
          <div className={'member-data-content'}>
            {sessionData?.endAt
              ? new Intl.DateTimeFormat('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  hour: 'numeric',
                  minute: 'numeric',
                  day: 'numeric',
                }).format(new Date(sessionData.endAt))
              : 'TBD'}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Created At</div>
          <div className={'member-data-content'}>
            {new Intl.DateTimeFormat('ko-KR', {
              year: 'numeric',
              month: 'long',
              hour: 'numeric',
              minute: 'numeric',
              day: 'numeric',
            }).format(new Date(sessionData.createdAt))}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Updated At</div>
          <div className={'member-data-content'}>
            {new Intl.DateTimeFormat('ko-KR', {
              year: 'numeric',
              month: 'long',
              hour: 'numeric',
              minute: 'numeric',
              day: 'numeric',
            }).format(new Date(sessionData.updatedAt))}
          </div>
        </div>
      </div>

      <div
        className={'member-data-col-span grid grid-cols-1 gap-2 sm:grid-cols-2'}
      >
        <div className={'mx-auto flex w-full max-w-lg flex-col py-2'}>
          <div className={'member-data-title'}>Main Image</div>
          <Image
            src={sessionData.mainImage}
            alt={sessionData.mainImage}
            width={600}
            height={400}
            className={'w-full'}
            placeholder={'blur'}
            blurDataURL={'/default-image.png'}
          />
        </div>
        <div className={'mx-auto flex w-full max-w-lg flex-col py-2'}>
          <div className={'member-data-title'}>Content Images</div>
          {sessionData.images.map((image, index) => (
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
    </AdminDefaultLayout>
  )
}
