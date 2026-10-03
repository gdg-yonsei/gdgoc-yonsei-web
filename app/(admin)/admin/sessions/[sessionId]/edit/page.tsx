/**
 * 세션 수정 화면(`/admin/sessions/{id}/edit`). 권한은 레이아웃이 확인하고, 항목이 없으면 404.
 */
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/admin/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { updateSessionAction } from '@/app/(admin)/admin/sessions/[sessionId]/edit/actions'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import { Metadata } from 'next'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import DataSelectInput from '@/app/components/admin/data-select-input'
import {
  SESSION_CATEGORY_OPTIONS,
  sessionTypeOptions,
} from '@/app/(admin)/admin/sessions/_lib/session-form-options'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { requirePermission } from '@/lib/server/permission/require-permission'
import {
  resolveAdminGenerationScope,
  canSwitchToGeneration,
} from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import ResourceImageFields from '@/app/components/admin/resource-image-fields'
import GenerationField from '@/app/components/admin/generation-field'
import {
  BilingualInputField,
  BilingualMdxField,
} from '@/app/components/admin/bilingual-fields'
import { groupMemberships } from '@/lib/admin/member-options'
import { connection } from 'next/server'

/** 브라우저 탭 제목. */
export const metadata: Metadata = {
  title: 'Edit Session',
}

/** 기존 값을 채운 세션 수정 폼. */
export default async function EditSessionPage({
  params,
}: PageProps<'/admin/sessions/[sessionId]/edit'>) {
  await connection()
  const [{ sessionId }, locale] = await Promise.all([params, getAdminLocale()])
  const t = getAdminMessages(locale)
  const sessionData = await getSession(sessionId)

  if (!sessionData) {
    notFound()
  }

  // 세션 생성 권한이 있는 사용자만 수정 화면을 열 수 있다.
  const session = await requirePermission(
    'put',
    'sessions',
    sessionData.authorId
  )

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
  const uniqueMembers = groupMemberships(membersData)
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
          canSwitch={canSwitchToGeneration(resolvedScope, actualGeneration.id)}
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
        className={'admin-form-grid w-full gap-4'}
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
          data={sessionTypeOptions(t)}
          name={'type'}
          title={t.sessionType}
          defaultValue={sessionData.type ? sessionData.type : 'Part Session'}
        />
        <DataSelectInput
          data={SESSION_CATEGORY_OPTIONS}
          name={'category'}
          title={'Activity Category'}
          defaultValue={sessionData.category ?? 'tech_talk'}
        />
        <div className={'flex flex-col gap-1'}>
          <DataInput
            title={t.displayOnWebsite}
            defaultValue={'true'}
            name={'displayOnWebsite'}
            placeholder={t.displayOnWebsite}
            type={'checkbox'}
            isChecked={sessionData.displayOnWebsite!}
          />
          <p className={'text-ink-muted text-xs'}>
            {t.sessionPublicationImageHint}
          </p>
        </div>
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
