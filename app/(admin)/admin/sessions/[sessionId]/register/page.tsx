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

  if (
    !sessionData.internalOpen ||
    (sessionData.endAt && sessionData?.endAt < new Date())
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
            {t.remainingSeats}: {leftSeats}
          </div>
          <DataForm
            action={registerSessionActionWithSessionId}
            className={'w-full'}
          >
            <SubmitButton className={'admin-btn-primary w-full'}>
              {t.register}
            </SubmitButton>
          </DataForm>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
