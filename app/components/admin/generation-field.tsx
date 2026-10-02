/**
 * 편집 폼에서 고칠 수 없는 기수 정보를 보여 주는 읽기 전용 필드.
 */

/**
 * 기수 이름을 표시하고, 필요하면 기수 id를 숨은 필드로 함께 제출한다.
 *
 * @param title 라벨
 * @param value 화면에 보일 값(기수 이름)
 * @param inputName/inputValue 둘 다 있으면 숨은 `<input>`으로 폼에 싣는다
 */
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
