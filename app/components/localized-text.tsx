/** 서버에서 언어를 읽을 수 없는 경계·공유 셸은 두 언어를 렌더링하고 html lang에 따라 CSS로 하나를 숨긴다. */
export default function LocalizedText({ en, ko }: { en: string; ko: string }) {
  return (
    <>
      <span className="locale-copy-en">{en}</span>
      <span className="locale-copy-ko">{ko}</span>
    </>
  )
}
