/**
 * 세션 생성·수정 폼의 입력 필드 목록(서버 컴포넌트). 두 화면이 같은 필드를 같은 순서로 그리도록 한 곳에 둔다.
 * 폼(`DataForm`)과 제출 버튼은 각 페이지가 감싼다.
 */
import DataInput from '@/app/components/admin/data-input'
import DataSelectInput from '@/app/components/admin/data-select-input'
import GenerationField from '@/app/components/admin/generation-field'
import ResourceImageFields from '@/app/components/admin/resource-image-fields'
import SessionPartParticipantsInput, {
  type SessionMemberOption,
  type SessionPartOption,
} from '@/app/components/admin/session-part-participants-input'
import {
  BilingualInputField,
  BilingualMdxField,
} from '@/app/components/admin/bilingual-fields'
import {
  SESSION_CATEGORY_OPTIONS,
  sessionTypeOptions,
} from '@/app/(admin)/admin/sessions/_lib/session-form-options'
import type { AdminMessages } from '@/lib/admin-i18n'
import type { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import type { getSession } from '@/lib/server/fetcher/admin/get-session'

/** 수정 화면이 채워 넣는 기존 세션. */
type SavedSession = NonNullable<Awaited<ReturnType<typeof getSession>>>

/** 기수의 파트와 구성원을 담당 파트 선택지로 바꾼다. 기수를 못 찾으면 빈 목록. */
export function toSessionPartOptions(
  generation: Awaited<ReturnType<typeof getGeneration>> | null
): SessionPartOption[] {
  if (!generation) {
    return []
  }

  return generation.parts.map((part) => ({
    id: part.id,
    name: part.name,
    generationName: generation.name,
    members: part.usersToParts.map(({ user }) => ({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      firstNameKo: user.firstNameKo,
      lastNameKo: user.lastNameKo,
      isForeigner: user.isForeigner,
    })),
  }))
}

/** `datetime-local` 입력값(`YYYY-MM-DDTHH:MM`). 세션 시각은 서울 시각을 UTC 라벨로 저장한다. */
function toDateTimeLocal(value: Date | null) {
  return value?.toISOString().slice(0, 16) ?? ''
}

/**
 * 세션 입력 필드. `session`이 있으면 수정 화면으로 보고 기존 값을 채운다.
 *
 * @param generationName 세션이 속한 기수 이름(읽기 전용 표시)
 * @param members 참가자로 고를 수 있는 멤버
 * @param parts 담당 파트 선택지(`toSessionPartOptions`)
 */
export default function SessionFormFields({
  t,
  generationName,
  members,
  parts,
  session,
}: {
  t: AdminMessages
  generationName: string | null | undefined
  members: SessionMemberOption[]
  parts: SessionPartOption[]
  session?: SavedSession
}) {
  return (
    <>
      <ResourceImageFields
        mainImageBaseUrl={'/api/admin/sessions/main-image'}
        contentImageBaseUrl={'/api/admin/sessions/content-image'}
        mainImageDefaultValue={session?.mainImage}
        contentImagesDefaultValue={session?.images}
        t={t}
      />
      <GenerationField title={t.generation} value={generationName} />
      <BilingualInputField
        t={t}
        fieldLabel={t.name}
        enName={'name'}
        koName={'nameKo'}
        enTitle={t.nameEn}
        koTitle={t.nameKo}
        enPlaceholder={t.nameEn}
        koPlaceholder={t.nameKo}
        enDefaultValue={session?.name}
        koDefaultValue={session?.nameKo}
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
        enDefaultValue={session?.location}
        koDefaultValue={session?.locationKo}
        required={true}
      />
      <DataSelectInput
        data={sessionTypeOptions(t)}
        name={'type'}
        title={t.sessionType}
        defaultValue={session?.type ?? 'Part Session'}
      />
      <DataSelectInput
        data={SESSION_CATEGORY_OPTIONS}
        name={'category'}
        title={'Activity Category'}
        defaultValue={session?.category ?? 'tech_talk'}
      />
      <div className={'flex flex-col gap-1'}>
        <DataInput
          title={t.displayOnWebsite}
          defaultValue={'true'}
          name={'displayOnWebsite'}
          placeholder={t.displayOnWebsite}
          type={'checkbox'}
          isChecked={session?.displayOnWebsite ?? false}
        />
        <p className={'text-ink-muted text-xs'}>
          {session ? t.sessionPublicationImageHint : t.sessionCreateImageHint}
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
        enDefaultValue={session?.description}
        koDefaultValue={session?.descriptionKo}
      />
      <div className={'flex flex-col gap-1'}>
        <DataInput
          title={t.internalOpen}
          defaultValue={'true'}
          name={'internalOpen'}
          placeholder={t.internalOpen}
          type={'checkbox'}
          isChecked={session?.internalOpen ?? true}
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
          isChecked={session?.publicOpen ?? false}
        />
        <p className={'text-xs'}>{t.publicSessionHint}</p>
      </div>
      <DataInput
        title={t.maxCapacity}
        defaultValue={session?.maxCapacity ?? 0}
        name={'maxCapacity'}
        placeholder={'Enter a number'}
        type={'number'}
        required={true}
      />
      <DataInput
        title={t.startTime}
        defaultValue={toDateTimeLocal(session?.startAt ?? null)}
        name={'startAt'}
        placeholder={'YYYY-MM-DDTHH:MM'}
        type={'datetime-local'}
        required={true}
      />
      <DataInput
        title={t.endTime}
        defaultValue={toDateTimeLocal(session?.endAt ?? null)}
        name={'endAt'}
        placeholder={'YYYY-MM-DDTHH:MM'}
        type={'datetime-local'}
        required={true}
      />
      <SessionPartParticipantsInput
        defaultValue={
          session
            ? {
                partId: session.partId,
                selectedMembers: session.userToSession.map(
                  ({ userId }) => userId
                ),
              }
            : undefined
        }
        members={members}
        parts={parts}
      />
    </>
  )
}
