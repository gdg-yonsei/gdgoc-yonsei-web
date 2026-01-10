export default function addLangParams<T>(
  paramsList: T[],
  langs: string[]
): (T & { lang: string })[] {
  // flatMap을 사용하여 각 아이템을 여러 언어 버전으로 확장한 뒤, 1차원 배열로 평탄화합니다.
  return paramsList.flatMap((item) =>
    langs.map((lang) => ({
      ...item,
      lang: lang, // 각 언어를 개별적으로 할당
    }))
  )
}
