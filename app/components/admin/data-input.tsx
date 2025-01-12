export default function DataInput({
  defaultValue,
  name,
  placeholder,
  title,
}: {
  defaultValue: string | number | undefined | null
  name: string
  placeholder: string
  title: string
}) {
  return (
    <div className={'flex flex-col'}>
      <p className={'text-sm font-semibold text-neutral-700 px-1'}>{title}</p>
      <input
        className={'member-data-input'}
        defaultValue={defaultValue ? defaultValue : ''}
        name={name}
        placeholder={placeholder}
      />
    </div>
  )
}
