/**
 * 영어·한국어 문구를 함께 그린다. `<html lang>`에 따라 CSS(`.locale-copy-*`)가 하나를 숨긴다.
 *
 * 언어를 서버에서 읽을 수 없는 곳(에러 경계, 언어와 무관하게 캐시되는 셸)에서 쓴다.
 */
export default function LocalizedText({ en, ko }: { en: string; ko: string }) {
  return (
    <>
      <span className="locale-copy-en">{en}</span>
      <span className="locale-copy-ko">{ko}</span>
    </>
  )
}
