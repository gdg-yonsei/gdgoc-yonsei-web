import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { getPart } from '@/lib/server/fetcher/admin/get-part'
import { updatePartAction } from '@/app/(admin)/admin/parts/[partId]/edit/actions'
import DataTextarea from '@/app/components/admin/data-textarea'
import DataForm from '@/app/components/data-form'
import { getGenerations } from '@/lib/server/fetcher/admin/get-generations'
import DataSelectInput from '@/app/components/admin/data-select-input'
import { getMembers } from '@/lib/server/fetcher/admin/get-members'
import DataSelectMultipleInput from '@/app/components/admin/data-select-multiple-input'
import formatUserName from '@/lib/format-user-name'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Part',
}

export default async function EditGenerationPage({
  params,
}: {
  params: Promise<{ partId: string }>
}) {
  const { partId } = await params
  // Part 정보 가져오기
  const partData = await getPart(Number(partId))
  // 파트에 속한 멤버 정보 리스트
  const membersIdList = partData
    ? partData.usersToParts.map((user) => user.user.id)
    : []

  // 파트 정보가 없다면 404 페이지로 이동
  if (!partData) {
    notFound()
  }

  // Part 정보 업데이트 Action
  const updatePartsActionWithPartId = updatePartAction.bind(null, partId)

  const generations = await getGenerations()
  const generationList = generations.map((generation) => ({
    name: generation.name,
    value: String(generation.id),
  }))

  const membersData = await getMembers()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={`/admin/parts/${partId}`}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>{partData.name}</p>
      </AdminNavigationButton>
      <div className={'admin-title py-4'}>Edit {partData.name}</div>
      <DataForm
        action={updatePartsActionWithPartId}
        className={'member-data-grid w-full gap-4'}
      >
        <DataInput
          title={'Name'}
          defaultValue={partData.name}
          name={'name'}
          placeholder={'Name'}
        />
        <DataTextarea
          defaultValue={partData.description}
          name={'description'}
          placeholder={'Description'}
        />
        <DataSelectInput
          title={'Generation'}
          data={generationList}
          name={'generationId'}
          defaultValue={String(partData.generationsId)}
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
          defaultValue={membersIdList}
        />
        <SubmitButton />
      </DataForm>
    </AdminDefaultLayout>
  )
}
