import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import Image from 'next/image'
import { getAuthSession } from '@/auth'
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
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { sessionId } = await params
  // Session 데이터 가져오기
  const sessionData = await getSession(sessionId)

  // Session 데이터가 없으면 404 페이지 표시
  if (!sessionData) {
    notFound()
  }

  const session = await getAuthSession()

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
