import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { updateSessionAction } from '@/app/(admin)/admin/sessions/[sessionId]/edit/actions'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import { Metadata } from 'next'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import DataSelectInput from '@/app/components/admin/data-select-input'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import ResourceImageFields from '@/app/components/admin/resource-image-fields'
import GenerationField from '@/app/components/admin/generation-field'
import {
  BilingualInputField,
  BilingualMdxField,
} from '@/app/components/admin/bilingual-fields'
import { dedupeById } from '@/lib/admin/member-options'
import { connection } from 'next/server'

export const metadata: Metadata = {
  title: 'Edit Session',
}

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  await connection()
  const [{ sessionId }, locale] = await Promise.all([params, getAdminLocale()])
  const t = getAdminMessages(locale)
  const [sessionData, session] = await Promise.all([
    getSession(sessionId),
    auth(),
  ])

  if (!sessionData) {
    notFound()
  }

  const updateSessionActionWithSessionId = updateSessionAction.bind(
    null,
    sessionId
  )

  const actualGeneration = sessionData.part?.generation
    ? {
        id: sessionData.part.generation.id,
        name: sessionData.part.generation.name,
      }
    : null
  const [resolvedScope, generationData, membersData] = await Promise.all([
    session?.user?.id
      ? resolveAdminGenerationScope(session.user.id)
      : Promise.resolve(null),
    actualGeneration
      ? getGeneration(actualGeneration.id)
      : Promise.resolve(null),
    getMembers(null),
  ])
  const uniqueMembers = dedupeById(membersData)
  const scopedParts =
    generationData?.parts.map((part) => ({
      id: part.id,
      name: part.name,
      generationName: generationData.name,
      members: part.usersToParts.map((userToPart) => ({
        id: userToPart.user.id,
        name: userToPart.user.name,
        firstName: userToPart.user.firstName,
        lastName: userToPart.user.lastName,
        firstNameKo: userToPart.user.firstNameKo,
        lastNameKo: userToPart.user.lastNameKo,
        isForeigner: userToPart.user.isForeigner,
      })),
    })) ?? []

  return (
    <AdminDefaultLayout>
      {actualGeneration && (
        <AdminGenerationScopeMismatchNotice
          actualGeneration={actualGeneration}
          canSwitch={
            resolvedScope?.canAccessAll === true ||
            resolvedScope?.options.some(
              (option) => option.id === actualGeneration.id
            ) === true
          }
          currentScope={resolvedScope?.scope ?? null}
          locale={locale}
        />
      )}
      <AdminNavigationButton href={`/admin/sessions/${sessionId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>
          {sessionData.name} {t.session}
        </p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>
        {t.edit} {sessionData.name} {t.session}
      </div>
      <DataForm
        action={updateSessionActionWithSessionId}
        className={'member-data-grid w-full gap-4'}
      >
        <GenerationField title={t.generation} value={actualGeneration?.name} />
        <BilingualInputField
          t={t}
          fieldLabel={t.name}
          enName={'name'}
          koName={'nameKo'}
          enTitle={t.nameEn}
          koTitle={t.nameKo}
          enPlaceholder={t.nameEn}
          koPlaceholder={t.nameKo}
          enDefaultValue={sessionData.name}
          koDefaultValue={sessionData.nameKo}
        />
        <BilingualInputField
          t={t}
          fieldLabel={t.location}
          enName={'location'}
          koName={'locationKo'}
          enTitle={t.locationEn}
          koTitle={t.locationKo}
          enPlaceholder={t.locationEn}
          koPlaceholder={t.locationKo}
          enDefaultValue={sessionData.location}
          koDefaultValue={sessionData.locationKo}
        />
        <DataSelectInput
          data={[
            { name: t.generalSession, value: 'General Session' },
            { name: t.partSession, value: 'Part Session' },
          ]}
          name={'type'}
          title={t.sessionType}
          defaultValue={sessionData.type ? sessionData.type : 'Part Session'}
        />
        <DataSelectInput
          data={[
            { name: 'Tech Talk (T19)', value: 'tech_talk' },
            { name: 'Part Session', value: 'part_session' },
            { name: 'Hackathon', value: 'hackathon' },
            { name: 'Demo Day', value: 'demo_day' },
            { name: 'DevRel / Social', value: 'devrel' },
          ]}
          name={'category'}
          title={'Activity Category'}
          defaultValue={sessionData.category ?? 'tech_talk'}
        />
        <DataInput
          title={t.displayOnWebsite}
          defaultValue={'true'}
          name={'displayOnWebsite'}
          placeholder={t.displayOnWebsite}
          type={'checkbox'}
          isChecked={sessionData.displayOnWebsite!}
        />
        <BilingualMdxField
          t={t}
          fieldLabel={t.description}
          enName={'description'}
          koName={'descriptionKo'}
          enTitle={t.descriptionEn}
          koTitle={t.descriptionKo}
          enPlaceholder={'Write the session description in English.'}
          koPlaceholder={'세션 설명을 한국어로 작성하세요.'}
          enDefaultValue={sessionData.description}
          koDefaultValue={sessionData.descriptionKo}
        />

        <DataInput
          title={t.internalOpen}
          name={'internalOpen'}
          placeholder={t.internalOpen}
          type={'checkbox'}
          defaultValue={'true'}
          isChecked={sessionData.internalOpen!}
        />
        <DataInput
          title={t.publicOpen}
          name={'publicOpen'}
          placeholder={t.publicOpen}
          type={'checkbox'}
          defaultValue={'true'}
          isChecked={sessionData.publicOpen!}
        />
        <DataInput
          title={t.maxCapacity}
          defaultValue={sessionData.maxCapacity}
          name={'maxCapacity'}
          placeholder={t.maxCapacity}
          type={'number'}
        />
        <DataInput
          defaultValue={sessionData.startAt?.toISOString().slice(0, 16)}
          name={'startAt'}
          placeholder={'YYYY-MM-DD'}
          title={t.startTime}
          type={'datetime-local'}
        />
        <DataInput
          defaultValue={sessionData.endAt?.toISOString().slice(0, 16)}
          name={'endAt'}
          placeholder={'YYYY-MM-DD'}
          title={t.endTime}
          type={'datetime-local'}
        />
        <SessionPartParticipantsInput
          defaultValue={{
            partId: sessionData.partId,
            selectedMembers: sessionData.userToSession.map(
              (user) => user.userId
            ),
          }}
          members={uniqueMembers}
          parts={scopedParts}
        />
        <ResourceImageFields
          mainImageBaseUrl={'/api/admin/sessions/main-image'}
          contentImageBaseUrl={'/api/admin/sessions/content-image'}
          mainImageDefaultValue={sessionData.mainImage}
          contentImagesDefaultValue={sessionData.images.map((image) => image)}
          t={t}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
