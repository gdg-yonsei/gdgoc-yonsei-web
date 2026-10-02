/**
 * JSON-LD를 `<script>` 안에 넣어도 안전한 문자열로 직렬화한다.
 *
 * `<`를 `\u003c`로 바꿔, 데이터 안의 `</script>`가 태그를 닫아 버리는 일(XSS)을 막는다.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * `application/ld+json` 스크립트 태그.
 *
 * @param data 구조화 데이터 객체
 * @param id 같은 페이지에 여러 개를 둘 때 구분용 id
 */
export default function JsonLd({ data, id }: { data: unknown; id?: string }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
