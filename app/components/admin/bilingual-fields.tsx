import type { ReactNode } from 'react'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import DataInput from '@/app/components/admin/data-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import MDXEditor from '@/app/components/admin/mdx-editor'
import { type AdminMessages } from '@/lib/admin-i18n'

type BilingualFieldShellProps = {
  t: AdminMessages
  fieldLabel: string
  enFieldName: string
  koFieldName: string
  enContent: ReactNode
  koContent: ReactNode
}

function BilingualFieldShell({
  t,
  fieldLabel,
  enFieldName,
  koFieldName,
  enContent,
  koContent,
}: BilingualFieldShellProps) {
  return (
    <div className={'col-span-1 sm:col-span-2 lg:col-span-4'}>
      <BilingualPanel
        enTitle={t.english}
        koTitle={t.korean}
        fieldLabel={fieldLabel}
        requiredBoth={true}
        enFieldNames={[enFieldName]}
        koFieldNames={[koFieldName]}
        enContent={enContent}
        koContent={koContent}
      />
    </div>
  )
}

export function BilingualInputField({
  t,
  fieldLabel,
  enName,
  koName,
  enTitle,
  koTitle,
  enPlaceholder,
  koPlaceholder,
  enDefaultValue,
  koDefaultValue,
  required = false,
}: {
  t: AdminMessages
  fieldLabel: string
  enName: string
  koName: string
  enTitle: string
  koTitle: string
  enPlaceholder: string
  koPlaceholder: string
  enDefaultValue?: string | null
  koDefaultValue?: string | null
  required?: boolean
}) {
  return (
    <BilingualFieldShell
      t={t}
      fieldLabel={fieldLabel}
      enFieldName={enName}
      koFieldName={koName}
      enContent={
        <DataInput
          title={enTitle}
          defaultValue={enDefaultValue ?? ''}
          name={enName}
          placeholder={enPlaceholder}
          required={required}
        />
      }
      koContent={
        <DataInput
          title={koTitle}
          defaultValue={koDefaultValue ?? ''}
          name={koName}
          placeholder={koPlaceholder}
          required={required}
        />
      }
    />
  )
}

export function BilingualTextareaField({
  t,
  fieldLabel,
  enName,
  koName,
  enPlaceholder,
  koPlaceholder,
  enDefaultValue,
  koDefaultValue,
}: {
  t: AdminMessages
  fieldLabel: string
  enName: string
  koName: string
  enPlaceholder: string
  koPlaceholder: string
  enDefaultValue?: string | null
  koDefaultValue?: string | null
}) {
  return (
    <BilingualFieldShell
      t={t}
      fieldLabel={fieldLabel}
      enFieldName={enName}
      koFieldName={koName}
      enContent={
        <DataTextarea
          defaultValue={enDefaultValue ?? ''}
          name={enName}
          placeholder={enPlaceholder}
        />
      }
      koContent={
        <DataTextarea
          defaultValue={koDefaultValue ?? ''}
          name={koName}
          placeholder={koPlaceholder}
        />
      }
    />
  )
}

export function BilingualMdxField({
  t,
  fieldLabel,
  enName,
  koName,
  enTitle,
  koTitle,
  enPlaceholder,
  koPlaceholder,
  enDefaultValue,
  koDefaultValue,
}: {
  t: AdminMessages
  fieldLabel: string
  enName: string
  koName: string
  enTitle: string
  koTitle: string
  enPlaceholder: string
  koPlaceholder: string
  enDefaultValue?: string | null
  koDefaultValue?: string | null
}) {
  return (
    <BilingualFieldShell
      t={t}
      fieldLabel={fieldLabel}
      enFieldName={enName}
      koFieldName={koName}
      enContent={
        <MDXEditor
          title={enTitle}
          name={enName}
          defaultValue={enDefaultValue ?? undefined}
          placeholder={enPlaceholder}
        />
      }
      koContent={
        <MDXEditor
          title={koTitle}
          name={koName}
          defaultValue={koDefaultValue ?? undefined}
          placeholder={koPlaceholder}
        />
      }
    />
  )
}
