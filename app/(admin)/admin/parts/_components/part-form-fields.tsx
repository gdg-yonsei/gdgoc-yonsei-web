import DataInput from '@/app/components/admin/data-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import GenerationField from '@/app/components/admin/generation-field'
import PartMembersInput, {
  type PartMemberOption,
} from '@/app/components/admin/part-members-input'
import type { AdminMessages } from '@/lib/admin-i18n'
import type { getPart } from '@/lib/server/fetcher/admin/get-part'

type SavedPart = NonNullable<Awaited<ReturnType<typeof getPart>>>

function memberIds(part: SavedPart | undefined, userType: string) {
  return (
    part?.usersToParts
      .filter((membership) => membership.userType === userType)
      .map(({ user }) => user.id) ?? []
  )
}

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
