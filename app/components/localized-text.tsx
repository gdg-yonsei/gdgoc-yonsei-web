export default function LocalizedText({ en, ko }: { en: string; ko: string }) {
  return (
    <>
      <span className="locale-copy-en">{en}</span>
      <span className="locale-copy-ko">{ko}</span>
    </>
  )
}
