import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import { notFound } from 'next/navigation'
import DataForm from '@/app/components/data-form'
import SubmitButton from '@/app/components/admin/submit-button'
import { registerSessionAction } from '@/app/(admin)/admin/sessions/[sessionId]/register/actions'
import formatUserName from '@/lib/format-user-name'
import {
  formatAdminDate,
  getAdminLocale,
  getAdminMessages,
} from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import { sessionWallClockNow } from '@/lib/site/datetime'
import { connection } from 'next/server'

export default async function RegisterSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  await connection()
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { sessionId } = await params

  const sessionData = await getSession(sessionId)

  if (!sessionData) {
    notFound()
  }

  const maxCapacity = sessionData.maxCapacity ? sessionData.maxCapacity : 0
  const leftSeats = maxCapacity - sessionData.userToSession.length

  const registerSessionActionWithSessionId = registerSessionAction.bind(
    null,
    sessionId
  )

  // 등록 동작과 같은 조건: internalOpen 또는 publicOpen 이 열려 있고,
  // endAt 은 Seoul 벽시계(UTC 라벨)로 저장된 값이므로 벽시계 기준으로 비교한다.
  if (
    !(sessionData.internalOpen || sessionData.publicOpen) ||
    (sessionData.endAt && sessionData.endAt < sessionWallClockNow())
  ) {
    return (
      <AdminDefaultLayout>
        <AdminNavigationButton href={'/admin/sessions'}>
          <ChevronLeftIcon className={'size-8'} />
          <p className={'text-lg'}>{t.sessions}</p>
        </AdminNavigationButton>
        <div className={'flex items-center gap-2'}>
          <div className={'admin-title'}>{t.sessionRegistrationEnd}</div>
        </div>
      </AdminDefaultLayout>
    )
  }

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/sessions'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.sessions}</p>
      </AdminNavigationButton>
      <div className={'flex items-center gap-2'}>
        <div className={'admin-title'}>{t.sessionRegistration}</div>
      </div>
      <div className={'grid w-full grid-cols-1 gap-2 md:grid-cols-2'}>
        <div className={'bg-surface w-full rounded-xl p-2'}>
          <h2>{t.sessionInformation}</h2>
          <BilingualPanel
            className={'py-1'}
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div>
                <p className={'text-ink-secondary text-sm'}>{t.session}</p>
                <p>{sessionData.name}</p>
              </div>
            }
            koContent={
              <div>
                <p className={'text-ink-secondary text-sm'}>{t.session}</p>
                <p>{sessionData.nameKo}</p>
              </div>
            }
          />
          <BilingualPanel
            className={'py-1'}
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div>
                <p className={'text-ink-secondary text-sm'}>{t.description}</p>
                <p>{sessionData.description}</p>
              </div>
            }
            koContent={
              <div>
                <p className={'text-ink-secondary text-sm'}>{t.description}</p>
                <p>{sessionData.descriptionKo}</p>
              </div>
            }
          />
          <BilingualPanel
            className={'py-1'}
            enTitle={t.english}
            koTitle={t.korean}
            enContent={
              <div>
                <p className={'text-ink-secondary text-sm'}>{t.location}</p>
                <p>{sessionData.location}</p>
              </div>
            }
            koContent={
              <div>
                <p className={'text-ink-secondary text-sm'}>{t.location}</p>
                <p>{sessionData.locationKo}</p>
              </div>
            }
          />
          <div className={'py-1'}>
            <p className={'text-ink-secondary text-sm'}>{t.schedule}</p>
            <p>
              {t.start}:{' '}
              {sessionData.startAt
                ? formatAdminDate(sessionData.startAt, locale, {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    // 세션 시간은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
                    timeZone: 'UTC',
                  })
                : t.tbd}
            </p>
            <p className={''}>
              {t.end}:{' '}
              {sessionData.endAt
                ? formatAdminDate(sessionData.endAt, locale, {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'UTC',
                  })
                : t.tbd}
            </p>
          </div>
          <div className={'py-1'}>
            <p className={'text-ink-secondary text-sm'}>{t.participants}</p>
            <div
              className={
                'grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }
            >
              {sessionData.userToSession.map((user) => (
                <p
                  key={user.userId}
                  className={
                    'border-hairline bg-surface rounded-lg border-2 p-1 px-2 text-center'
                  }
                >
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
                </p>
              ))}
            </div>
          </div>
        </div>
        <div
          className={
            'bg-surface flex w-full flex-col items-center justify-center gap-2 rounded-xl p-2'
          }
        >
          <div className={'text-2xl'}>
            {t.remainingSeats}: {Math.max(leftSeats, 0)}
          </div>
          {leftSeats > 0 ? (
            <DataForm
              action={registerSessionActionWithSessionId}
              className={'w-full'}
            >
              <SubmitButton className={'admin-btn-primary w-full'}>
                {t.register}
              </SubmitButton>
            </DataForm>
          ) : (
            <div className={'text-danger text-lg font-semibold'}>
              {t.sessionFull}
            </div>
          )}
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
