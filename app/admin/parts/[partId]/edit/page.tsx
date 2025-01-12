import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import DataInput from '@/app/components/admin/data-input'
import SubmitButton from '@/app/components/admin/submit-button'
import { getPart } from '@/lib/fetcher/get-part'
import { updatePartAction } from '@/app/admin/parts/[partId]/edit/actions'
import DataTextarea from '@/app/components/admin/data-textarea'
import DataForm from '@/app/components/data-form'
import { getGenerations } from '@/lib/fetcher/get-generations'
import DataSelectInput from '@/app/components/admin/data-select-input'
import { getMembers } from '@/lib/fetcher/get-members'
import DataSelectMultipleInput from '@/app/components/admin/data-select-multiple-input'
import formatUserName from '@/lib/format-user-name'

export default async function EditGenerationPage({
  params,
}: {
  params: Promise<{ partId: string }>
}) {
  const { partId } = await params
  const partData = await getPart(Number(partId))
  const membersIdList = partData
    ? partData.usersToParts.map((user) => user.user.id)
    : []

  if (!partData) {
    notFound()
  }

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
        className={'w-full gap-4 member-data-grid'}
      >
        <DataInput
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
