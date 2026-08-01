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
import {
  formatAdminDate,
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'

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
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
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
        <p className={'text-lg'}>{t.sessions}</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>{sessionData.name}</div>
        <DataEditLink
          session={session}
          dataOwnerId={sessionData.authorId}
          dataType={'sessions'}
          href={localizeAdminHref(`/admin/sessions/${sessionId}/edit`, locale)}
        />
        <DataDeleteButton
          session={session}
          dataType={'sessions'}
          dataId={sessionId}
        />
      </div>
      <div className={'admin-form-grid gap-2'}>
        <div className={'admin-form-grid-full'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.nameEn}</div>
                <div className={'admin-field-value'}>{sessionData.name}</div>
              </div>
            }
            koContent={
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.nameKo}</div>
                <div className={'admin-field-value'}>{sessionData.nameKo}</div>
              </div>
            }
          />
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.part}</div>
          <div className={'admin-field-value'}>{sessionData?.part?.name}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.generation}</div>
          <div className={'admin-field-value'}>
            {sessionData?.part?.generation?.name}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.maxCapacity}</div>
          <div className={'admin-field-value'}>{sessionData.maxCapacity}</div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.author}</div>
          <div className={'admin-field-value'}>
            {formatUserName(
              sessionData.author?.name,
              sessionData.author?.firstName,
              sessionData.author?.lastName,
              sessionData.author?.isForeigner
            )}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>
            {t.participants} {sessionData.userToSession.length}/
            {sessionData.maxCapacity}
          </div>
          <div className={'admin-field-value max-h-48 overflow-y-auto'}>
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
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.internalOpen}</div>
          <div className={'admin-field-value'}>
            {sessionData.internalOpen ? t.trueValue : t.falseValue}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.publicOpen}</div>
          <div className={'admin-field-value'}>
            {sessionData.publicOpen ? t.trueValue : t.falseValue}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.sessionType}</div>
          <div className={'admin-field-value'}>
            {sessionData.type === 'General Session'
              ? t.generalSession
              : sessionData.type === 'Part Session'
                ? t.partSession
                : sessionData.type}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.displayOnWebsite}</div>
          <div className={'admin-field-value'}>
            {sessionData.displayOnWebsite ? t.trueValue : t.falseValue}
          </div>
        </div>
        <div className={'admin-form-grid-full'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.locationEn}</div>
                <div className={'admin-field-value'}>
                  {sessionData.location}
                </div>
              </div>
            }
            koContent={
              <div className={'admin-card'}>
                <div className={'admin-field-label'}>{t.locationKo}</div>
                <div className={'admin-field-value'}>
                  {sessionData.locationKo}
                </div>
              </div>
            }
          />
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.startTime}</div>
          <div className={'admin-field-value'}>
            {sessionData?.startAt
              ? formatAdminDate(sessionData.startAt, locale, {
                  year: 'numeric',
                  month: 'long',
                  hour: 'numeric',
                  minute: 'numeric',
                  day: 'numeric',
                })
              : t.tbd}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.endTime}</div>
          <div className={'admin-field-value'}>
            {sessionData?.endAt
              ? formatAdminDate(sessionData.endAt, locale, {
                  year: 'numeric',
                  month: 'long',
                  hour: 'numeric',
                  minute: 'numeric',
                  day: 'numeric',
                })
              : t.tbd}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.createdAt}</div>
          <div className={'admin-field-value'}>
            {formatAdminDate(sessionData.createdAt, locale, {
              year: 'numeric',
              month: 'long',
              hour: 'numeric',
              minute: 'numeric',
              day: 'numeric',
            })}
          </div>
        </div>
        <div className={'admin-card'}>
          <div className={'admin-field-label'}>{t.updatedAt}</div>
          <div className={'admin-field-value'}>
            {formatAdminDate(sessionData.updatedAt, locale, {
              year: 'numeric',
              month: 'long',
              hour: 'numeric',
              minute: 'numeric',
              day: 'numeric',
            })}
          </div>
        </div>
        <div className={'admin-form-grid-full'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div className={'admin-card prose max-w-none'}>
                <div className={'admin-field-label'}>{t.descriptionEn}</div>
                <SafeMDX source={sessionData.description!} />
              </div>
            }
            koContent={
              <div className={'admin-card prose max-w-none'}>
                <div className={'admin-field-label'}>{t.descriptionKo}</div>
                <SafeMDX source={sessionData.descriptionKo!} />
              </div>
            }
          />
        </div>
      </div>

      <div
        className={'admin-form-grid-full grid grid-cols-1 gap-2 sm:grid-cols-2'}
      >
        <div className={'mx-auto flex w-full max-w-lg flex-col py-2'}>
          <div className={'admin-field-label'}>{t.mainImage}</div>
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
          <div className={'admin-field-label'}>{t.contentImages}</div>
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
