/** inputName·inputValue가 둘 다 있으면 읽기 전용 표시와 함께 기수 id를 숨은 필드로 제출한다. */
export default function GenerationField({
  title,
  value,
  inputName,
  inputValue,
}: {
  title: string
  value: string | null | undefined
  inputName?: string
  inputValue?: string | number | null
}) {
  return (
    <div className={'admin-form-grid-full admin-card'}>
      {inputName && inputValue != null && (
        <input
          hidden={true}
          name={inputName}
          readOnly={true}
          value={String(inputValue)}
        />
      )}
      <div className={'admin-field-label'}>{title}</div>
      <div className={'admin-field-value'}>{value}</div>
    </div>
  )
}
