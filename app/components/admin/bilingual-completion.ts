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

export function parseFieldNames(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

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
