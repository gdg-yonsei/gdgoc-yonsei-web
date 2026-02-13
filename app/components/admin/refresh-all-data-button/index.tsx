import Form from 'next/form'
import revalidateAllDataAction from '@/app/components/admin/refresh-all-data-button/actions'
import RefreshDataSubmitButton from '@/app/components/admin/refresh-all-data-button/button'

export default function RefreshAllDataButton() {
  return (
    <Form action={revalidateAllDataAction}>
      <RefreshDataSubmitButton />
    </Form>
  )
}
