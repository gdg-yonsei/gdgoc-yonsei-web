export default function DataInput({
  defaultValue,
  name,
  placeholder,
  title,
  type,
  isChecked,
}: {
  defaultValue: string | number | undefined | null
  name: string
  placeholder: string
  title: string
  type?: string
  isChecked?: boolean
}) {
  return (
    <div className={'flex flex-col'}>
      <p className={'text-sm font-semibold text-neutral-700 px-1'}>{title}</p>
      <input
        type={type ? type : 'text'}
        className={`member-data-input ${type === 'checkbox' && 'mr-auto size-6 mt-1 ml-1'}`}
        defaultValue={defaultValue ? defaultValue : ''}
        name={name}
        placeholder={placeholder}
        defaultChecked={isChecked}
      />
    </div>
  )
}
