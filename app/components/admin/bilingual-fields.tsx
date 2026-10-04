/**
 * 자주 쓰는 이중 언어 필드 묶음: 한 줄 입력, 여러 줄 입력, MDX 편집기.
 *
 * 각 컴포넌트는 `BilingualPanel`에 영어·한국어 입력을 넣고 "두 언어 모두 필수"로 설정한다.
 */
import type { ReactNode } from 'react'
import BilingualPanel from '@/app/components/admin/bilingual-panel'
import DataInput from '@/app/components/admin/data-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import MDXEditor from '@/app/components/admin/mdx-editor'
import { type AdminMessages } from '@/lib/admin-i18n'

/** 세 필드가 공유하는 패널 래퍼의 props. */
type BilingualFieldShellProps = {
  t: AdminMessages
  fieldLabel: string
  enFieldName: string
  koFieldName: string
  enContent: ReactNode
  koContent: ReactNode
}

/** 폼 그리드 전체 폭을 차지하고, 두 언어 모두 필수인 `BilingualPanel`. */
function BilingualFieldShell({
  t,
  fieldLabel,
  enFieldName,
  koFieldName,
  enContent,
  koContent,
}: BilingualFieldShellProps) {
  return (
    <div className={'admin-form-grid-full'}>
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

/**
 * 영어·한국어 한 줄 입력.
 *
 * @param enName/koName 폼 필드 이름(서버 파서가 읽는 키)
 * @param required 각 언어 `<input>`의 HTML required 여부
 */
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
  enDefaultValue?: string | null | undefined
  koDefaultValue?: string | null | undefined
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

/** 영어·한국어 여러 줄 입력. props 의미는 `BilingualInputField`와 같다. */
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
  enDefaultValue?: string | null | undefined
  koDefaultValue?: string | null | undefined
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

/** 영어·한국어 MDX 편집기. 본문(세션·프로젝트 설명)처럼 서식이 필요한 필드에 쓴다. */
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
  enDefaultValue?: string | null | undefined
  koDefaultValue?: string | null | undefined
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
          defaultValue={enDefaultValue}
          placeholder={enPlaceholder}
        />
      }
      koContent={
        <MDXEditor
          title={koTitle}
          name={koName}
          defaultValue={koDefaultValue}
          placeholder={koPlaceholder}
        />
      }
    />
  )
}
