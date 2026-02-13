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
import SafeMDX from '@/app/components/safe-mdx'

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
  params: Promise<{ sessionId: string }>
}): Promise<Metadata> {
  const { sessionId } = await params
  // Session 데이터 가져오기
  const sessionData = await getSession(sessionId)

  return {
    title: `Session: ${sessionData?.name}`,
  }
}

/**
 * `SessionPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
          dataOwnerId={sessionData.authorId}
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
          <div className={'member-data-title'}>Part</div>
          <div className={'member-data-content'}>{sessionData?.part?.name}</div>
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
          <div className={'member-data-title'}>Session Type</div>
          <div className={'member-data-content'}>{sessionData.type}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Display on Website</div>
          <div className={'member-data-content'}>
            {sessionData.displayOnWebsite ? 'True' : 'False'}
          </div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Session Location</div>
          <div className={'member-data-content'}>{sessionData.location}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Session Location (Korean)</div>
          <div className={'member-data-content'}>{sessionData.locationKo}</div>
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
        <div
          className={
            'member-data-box prose col-span-1 max-w-none sm:col-span-2 lg:col-span-3 xl:col-span-4'
          }
        >
          <div className={'member-data-title'}>Description</div>
          <SafeMDX source={sessionData.description!} />
        </div>
        <div
          className={
            'member-data-box prose col-span-1 max-w-none sm:col-span-2 lg:col-span-3 xl:col-span-4'
          }
        >
          <div className={'member-data-title'}>Description (Korean)</div>
          <SafeMDX source={sessionData.descriptionKo!} />
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
