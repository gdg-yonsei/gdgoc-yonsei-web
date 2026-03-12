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
import MDXEditor from '@/app/components/admin/mdx-editor'
import DataSelectInput from '@/app/components/admin/data-select-input'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import { auth } from '@/auth'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'

export const metadata: Metadata = {
  title: 'Create Session',
}

/**
 * `CreateSessionPage` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function CreateSessionPage() {
  const t = getAdminMessages(await getAdminLocale())
  const session = await auth()
  const resolvedScope = session?.user?.id
    ? await resolveAdminGenerationScope(session.user.id)
    : null

  if (resolvedScope?.scope?.kind !== 'generation' || !resolvedScope.selectedGeneration) {
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
          <div className={'font-semibold'}>{t.selectSpecificGenerationToCreate}</div>
        </div>
      </AdminDefaultLayout>
    )
  }

  const generationData = await getGeneration(resolvedScope.selectedGeneration.id)
  const membersData = await getMembers(resolvedScope.scope)

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
        <div className={'member-data-box col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4'}>
          <div className={'member-data-title'}>{t.generation}</div>
          <div className={'member-data-content'}>
            {resolvedScope.selectedGeneration.name}
          </div>
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
                title={t.nameEn}
                defaultValue={''}
                name={'name'}
                placeholder={t.nameEn}
                required={true}
              />
            }
            koContent={
              <DataInput
                title={t.nameKo}
                defaultValue={''}
                name={'nameKo'}
                placeholder={t.nameKo}
                required={true}
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
                defaultValue={''}
                name={'location'}
                placeholder={t.locationEn}
                required={true}
              />
            }
            koContent={
              <DataInput
                title={t.locationKo}
                defaultValue={''}
                name={'locationKo'}
                placeholder={t.locationKo}
                required={true}
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
              />
            }
            koContent={
              <MDXEditor
                title={t.descriptionKo}
                name={'descriptionKo'}
                placeholder={'세션 설명을 한국어로 작성하세요.'}
              />
            }
          />
        </div>
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
          members={membersData}
          parts={scopedParts}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
