'use client'

import DataForm from '@/app/components/data-form'
import { deleteUserAction } from '@/app/(admin)/admin/members/accept/actions'
import SubmitButton from '@/app/components/admin/submit-button'

export default function DeleteForm({ userId }: { userId: string }) {
  return (
    <DataForm action={deleteUserAction}>
      <input hidden={true} name={'userId'} value={userId} readOnly={true} />
      <SubmitButton
        className={
          'flex items-center gap-1 rounded-lg bg-red-500 p-1 px-3 text-neutral-50 transition-colors hover:bg-red-600'
        }
      >
        Delete
      </SubmitButton>
    </DataForm>
  )
}
