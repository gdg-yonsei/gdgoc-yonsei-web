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
