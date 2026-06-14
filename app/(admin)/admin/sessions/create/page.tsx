import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import { createSessionAction } from '@/app/(admin)/admin/sessions/create/actions'
import SubmitButton from '@/app/components/admin/submit-button'
import { Metadata } from 'next'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import DataSelectInput from '@/app/components/admin/data-select-input'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import GenerationField from '@/app/components/admin/generation-field'
import {
  BilingualInputField,
  BilingualMdxField,
} from '@/app/components/admin/bilingual-fields'
import { dedupeById } from '@/lib/admin/member-options'

export const metadata: Metadata = {
  title: 'Create Session',
}

export default async function CreateSessionPage() {
  const [locale, session] = await Promise.all([getAdminLocale(), auth()])
  const t = getAdminMessages(locale)
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null

  if (
    resolvedScope?.scope?.kind !== 'generation' ||
    !resolvedScope.selectedGeneration
  ) {
    return (
      <AdminDefaultLayout>
        <AdminNavigationButton href={'/admin/sessions'}>
          <ChevronLeftIcon className={'size-8'} />
          <p className={'text-lg'}>{t.sessions}</p>
        </AdminNavigationButton>
        <div className={'admin-title'}>
          {t.create} {t.session}
        </div>
        <div className={'rounded-2xl bg-white p-6 text-neutral-700'}>
          <div className={'font-semibold'}>
            {t.selectSpecificGenerationToCreate}
          </div>
        </div>
      </AdminDefaultLayout>
    )
  }

  const [generationData, membersData] = await Promise.all([
    getGeneration(resolvedScope.selectedGeneration.id),
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
      <AdminNavigationButton href={'/admin/sessions'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{t.sessions}</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>
        {t.create} {t.session}
      </div>
      <DataForm
        action={createSessionAction}
        className={'member-data-grid gap-2'}
      >
        <GenerationField
          title={t.generation}
          value={resolvedScope.selectedGeneration.name}
        />
        <BilingualInputField
          t={t}
          fieldLabel={t.name}
          enName={'name'}
          koName={'nameKo'}
          enTitle={t.nameEn}
          koTitle={t.nameKo}
          enPlaceholder={t.nameEn}
          koPlaceholder={t.nameKo}
          required={true}
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
          required={true}
        />
        <DataSelectInput
          data={[
            { name: t.generalSession, value: 'General Session' },
            { name: t.partSession, value: 'Part Session' },
          ]}
          name={'type'}
          title={t.sessionType}
          defaultValue={'Part Session'}
        />
        <DataInput
          title={t.displayOnWebsite}
          defaultValue={'true'}
          name={'displayOnWebsite'}
          placeholder={t.displayOnWebsite}
          type={'checkbox'}
          isChecked={false}
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
        />
        <div className={'flex flex-col gap-1'}>
          <DataInput
            title={t.internalOpen}
            defaultValue={'true'}
            name={'internalOpen'}
            placeholder={t.internalOpen}
            type={'checkbox'}
            isChecked={true}
          />
          <p className={'text-xs'}>{t.internalSessionHint}</p>
        </div>
        <div className={'flex flex-col gap-1'}>
          <DataInput
            title={t.publicOpen}
            defaultValue={'true'}
            name={'publicOpen'}
            placeholder={t.publicOpen}
            type={'checkbox'}
            isChecked={false}
          />
          <p className={'text-xs'}>{t.publicSessionHint}</p>
        </div>
        <DataInput
          title={t.maxCapacity}
          defaultValue={0}
          name={'maxCapacity'}
          placeholder={'Enter a number'}
          type={'number'}
          required={true}
        />
        <DataInput
          title={t.startTime}
          defaultValue={''}
          name={'startAt'}
          placeholder={'YYYY-MM-DDTHH:MM'}
          type={'datetime-local'}
          required={true}
        />
        <DataInput
          title={t.endTime}
          defaultValue={''}
          name={'endAt'}
          placeholder={'YYYY-MM-DDTHH:MM'}
          type={'datetime-local'}
          required={true}
        />
        <SessionPartParticipantsInput
          members={uniqueMembers}
          parts={scopedParts}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
