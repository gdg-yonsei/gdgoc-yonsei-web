/**
 * 파트 생성·수정 폼의 입력 필드 목록(서버 컴포넌트). 두 화면이 같은 필드를 같은 순서로 그리도록 한 곳에 둔다.
 * 폼(`DataForm`)과 제출 버튼은 각 페이지가 감싼다.
 */
import DataInput from '@/app/components/admin/data-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import GenerationField from '@/app/components/admin/generation-field'
import PartMembersInput, {
  type PartMemberOption,
} from '@/app/components/admin/part-members-input'
import type { AdminMessages } from '@/lib/admin-i18n'
import type { getPart } from '@/lib/server/fetcher/admin/get-part'

/** 수정 화면이 채워 넣는 기존 파트. */
type SavedPart = NonNullable<Awaited<ReturnType<typeof getPart>>>

/** 파트 구성원 중 `userType`이 같은 멤버의 id. */
function memberIds(part: SavedPart | undefined, userType: string) {
  return (
    part?.usersToParts
      .filter((membership) => membership.userType === userType)
      .map(({ user }) => user.id) ?? []
  )
}

/**
 * 파트 입력 필드. `part`가 있으면 수정 화면으로 보고 기존 값을 채운다.
 *
 * @param generation 파트가 속한 기수(이름은 표시, id는 숨은 필드로 제출)
 * @param members 구성원으로 고를 수 있는 멤버
 */
export default function PartFormFields({
  t,
  generation,
  members,
  part,
}: {
  t: AdminMessages
  generation: { id: number | null; name: string | null | undefined }
  members: PartMemberOption[]
  part?: SavedPart
}) {
  return (
    <>
      <DataInput
        title={t.name}
        defaultValue={part?.name ?? ''}
        name={'name'}
        placeholder={'e.g. Android, iOS, ...'}
      />
      <DataInput
        title={t.displayOrder}
        name="displayOrder"
        type="number"
        required
        defaultValue={part?.displayOrder ?? 10}
        placeholder="10"
      />
      <p className="text-ink-muted text-sm">{t.displayOrderHint}</p>
      <DataTextarea
        defaultValue={part?.description ?? ''}
        name={'description'}
        // DataTextarea는 placeholder를 라벨로도 쓴다.
        placeholder={t.description}
      />
      <GenerationField
        title={t.generation}
        value={generation.name}
        inputName={'generationId'}
        inputValue={generation.id}
      />
      <PartMembersInput
        members={members}
        name={'membersList'}
        title={t.members}
        defaultValue={memberIds(part, 'Primary')}
      />
      <PartMembersInput
        members={members}
        name={'doubleBoardMembersList'}
        title={t.doubleBoardMembers}
        defaultValue={memberIds(part, 'Secondary')}
      />
    </>
  )
}
