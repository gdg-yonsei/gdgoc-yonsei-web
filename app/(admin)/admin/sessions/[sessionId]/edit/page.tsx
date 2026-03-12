import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import { notFound } from 'next/navigation'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import DataImageInput from '@/app/components/admin/data-image-input'
import DataMultipleImageInput from '@/app/components/admin/data-multiple-image-input'
import { updateSessionAction } from '@/app/(admin)/admin/sessions/[sessionId]/edit/actions'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import { Metadata } from 'next'
import SessionPartParticipantsInput from '@/app/components/admin/session-part-participants-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import MDXEditor from '@/app/components/admin/mdx-editor'
import DataSelectInput from '@/app/components/admin/data-select-input'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import AdminGenerationScopeMismatchNotice from '@/app/components/admin/admin-generation-scope-mismatch-notice'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'

export const metadata: Metadata = {
  title: 'Edit Session',
}

/**
 * `EditSessionPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)
  const { sessionId } = await params
  const sessionData = await getSession(sessionId)
  if (!sessionData) {
    notFound()
  }

  const updateSessionActionWithSessionId = updateSessionAction.bind(
    null,
    sessionId
  )

  const session = await auth()
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null
  const actualGeneration = sessionData.part?.generation
    ? {
        id: sessionData.part.generation.id,
        name: sessionData.part.generation.name,
      }
    : null
  const generationData = actualGeneration
    ? await getGeneration(actualGeneration.id)
    : null
  const membersData =
    actualGeneration &&
    (await getMembers({
      kind: 'generation',
      generationId: actualGeneration.id,
    }))
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
        <div className={'member-data-box col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4'}>
          <div className={'member-data-title'}>{t.generation}</div>
          <div className={'member-data-content'}>{actualGeneration?.name}</div>
        </div>
        <div className={'col-span-1 sm:col-span-2 lg:col-span-4'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            fieldLabel={t.name}
            requiredBoth={true}
            enFieldNames={['name']}
            koFieldNames={['nameKo']}
            enContent={
              <DataInput
                defaultValue={sessionData.name}
                name={'name'}
                placeholder={t.nameEn}
                title={t.nameEn}
              />
            }
            koContent={
              <DataInput
                defaultValue={sessionData.nameKo}
                name={'nameKo'}
                placeholder={t.nameKo}
                title={t.nameKo}
              />
            }
          />
        </div>
        <div className={'col-span-1 sm:col-span-2 lg:col-span-4'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            fieldLabel={t.location}
            requiredBoth={true}
            enFieldNames={['location']}
            koFieldNames={['locationKo']}
            enContent={
              <DataInput
                title={t.locationEn}
                defaultValue={sessionData.location}
                name={'location'}
                placeholder={t.locationEn}
              />
            }
            koContent={
              <DataInput
                title={t.locationKo}
                defaultValue={sessionData.locationKo}
                name={'locationKo'}
                placeholder={t.locationKo}
              />
            }
          />
        </div>
        <DataSelectInput
          data={[
            { name: t.generalSession, value: 'General Session' },
            { name: t.partSession, value: 'Part Session' },
          ]}
          name={'type'}
          title={t.sessionType}
          defaultValue={sessionData.type ? sessionData.type : 'Part Session'}
        />
        <DataInput
          title={t.displayOnWebsite}
          defaultValue={'true'}
          name={'displayOnWebsite'}
          placeholder={t.displayOnWebsite}
          type={'checkbox'}
          isChecked={sessionData.displayOnWebsite!}
        />
        <div className={'col-span-1 sm:col-span-2 lg:col-span-4'}>
          <BilingualPanel
            enTitle={t.english}
            koTitle={t.korean}
            fieldLabel={t.description}
            requiredBoth={true}
            enFieldNames={['description']}
            koFieldNames={['descriptionKo']}
            enContent={
              <MDXEditor
                title={t.descriptionEn}
                name={'description'}
                placeholder={'Write the session description in English.'}
                defaultValue={sessionData.description}
              />
            }
            koContent={
              <MDXEditor
                title={t.descriptionKo}
                name={'descriptionKo'}
                placeholder={'세션 설명을 한국어로 작성하세요.'}
                defaultValue={sessionData.descriptionKo}
              />
            }
          />
        </div>

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
          members={membersData ?? []}
          parts={scopedParts}
        />

        <div
          className={
            'member-data-col-span col-span-1 grid grid-cols-1 gap-2 sm:col-span-3 sm:grid-cols-2 md:col-span-4'
          }
        >
          <div>
            <DataImageInput
              baseUrl={'/api/admin/sessions/main-image'}
              title={t.mainImage}
              name={'mainImage'}
              defaultValue={sessionData.mainImage}
            >
              {t.selectImage}
            </DataImageInput>
          </div>
          <div>
            <DataMultipleImageInput
              baseUrl={'/api/admin/sessions/content-image'}
              name={'contentImages'}
              title={t.contentImages}
              defaultValue={sessionData.images.map((image) => image)}
            >
              {t.selectImage}
            </DataMultipleImageInput>
          </div>
        </div>
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
