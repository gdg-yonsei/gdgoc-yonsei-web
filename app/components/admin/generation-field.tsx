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
    <div
      className={
        'member-data-box col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4'
      }
    >
      {inputName && inputValue != null && (
        <input
          hidden={true}
          name={inputName}
          readOnly={true}
          value={String(inputValue)}
        />
      )}
      <div className={'member-data-title'}>{title}</div>
      <div className={'member-data-content'}>{value}</div>
    </div>
  )
}
