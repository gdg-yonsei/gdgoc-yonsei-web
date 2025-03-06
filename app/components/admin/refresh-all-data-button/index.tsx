import Form from 'next/form'
import refresh from '@/app/components/admin/refresh-all-data-button/actions'
import Button from '@/app/components/admin/refresh-all-data-button/button'

export default function RefreshAllDataButton() {
  return (
    <Form action={refresh}>
      <Button />
    </Form>
  )
}
