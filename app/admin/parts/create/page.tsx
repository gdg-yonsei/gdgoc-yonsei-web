import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import DataForm from '@/app/components/data-form'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { createPartAction } from '@/app/admin/parts/create/actions'
import DataTextarea from '@/app/components/admin/data-textarea'
import DataSelectInput from '@/app/components/admin/data-select-input'
import DataSelectMultipleInput from '@/app/components/admin/data-select-multiple-input'
import formatUserName from '@/lib/format-user-name'
import { getGenerations } from '@/lib/fetcher/get-generations'
import { getMembers } from '@/lib/fetcher/get-members'

export default async function CreatePartPage() {
  // 기수 정보 가져오기
  const generations = await getGenerations()
  // 기수 선택용 리스트
  const generationList = generations.map((generation) => ({
    name: generation.name,
    value: String(generation.id),
  }))

  // 멤버 데이터 가져오기
  const membersData = await getMembers()

  return (
    <AdminDefaultLayout>
      <div className={'admin-title'}>Create New Part</div>
      <DataForm action={createPartAction} className={'gap-2 member-data-grid'}>
        <DataInput
          title={'Name'}
          defaultValue={''}
          name={'name'}
          placeholder={'Name'}
        />
        <DataTextarea
          defaultValue={''}
          name={'description'}
          placeholder={'Description'}
        />
        <DataSelectInput
          title={'Generation'}
          data={generationList}
          name={'generationId'}
          defaultValue={''}
        />
        <DataSelectMultipleInput
          data={membersData.map((member) => ({
            name: formatUserName(
              member.name,
              member.firstName,
              member.lastName
            ),
            value: member.id,
          }))}
          name={'membersList'}
          title={'Members'}
          defaultValue={[]}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
