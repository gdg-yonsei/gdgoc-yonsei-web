/**
 * 영어·한국어 쌍 입력의 작성 여부 판정(관리자 폼 공용).
 *
 * `BilingualPanel`은 입력할 때마다 탭 상태를 갱신하려고, `DataForm`은 제출 직전에
 * 빠진 언어를 막으려고 같은 판정을 쓴다. 두 곳의 규칙이 어긋나지 않도록 이 파일
 * 하나에 둔다.
 */

/** 패널이 다루는 언어. */
export type BilingualLanguage = 'en' | 'ko'

/** 폼 값이 채워졌는지. 문자열은 공백만 있으면 비어 있는 것으로, 파일은 크기로 본다. */
export function isFilledValue(value: FormDataEntryValue | null): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  if (value instanceof File) {
    return value.size > 0
  }
  return false
}

/** `data-*` 속성에 쉼표로 이어 붙인 필드 이름 목록을 배열로 되돌린다. */
export function parseFieldNames(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

/** 언어별로 지정된 필드가 모두 채워졌는지 계산한다. */
export function getLanguageCompletion(
  formData: FormData,
  enFieldNames: readonly string[],
  koFieldNames: readonly string[]
): Record<BilingualLanguage, boolean> {
  const isFilled = (name: string) => isFilledValue(formData.get(name))
  return {
    en: enFieldNames.every(isFilled),
    ko: koFieldNames.every(isFilled),
  }
}
