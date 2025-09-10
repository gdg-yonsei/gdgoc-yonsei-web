/**
 * Textarea input component
 * @param defaultValue - 기본값
 * @param name - input name
 * @param placeholder - input placeholder
 * @constructor
 */
export default function DataTextarea({
  defaultValue,
  name,
  placeholder,
}: {
  defaultValue: string | number | undefined | null
  name: string
  placeholder: string
}) {
  return (
    <div className={'col-span-1 flex flex-col sm:col-span-2 xl:col-span-3'}>
      <p className={'px-1 text-sm font-semibold text-neutral-700'}>
        {placeholder}
      </p>
      <textarea
        className={'member-data-input h-60'}
        defaultValue={defaultValue ? defaultValue : ''}
        name={name}
        placeholder={placeholder}
      />
    </div>
  )
}
