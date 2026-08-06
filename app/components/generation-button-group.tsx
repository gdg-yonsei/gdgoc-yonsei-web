import Link from 'next/link'

export default function GenerationButtonGroup({
  generationList,
  generation,
  lang,
  basePath,
}: {
  generationList: string[]
  generation: string
  lang: string
  basePath: string
}) {
  return (
    <div
      className={
        'flex h-24 items-center gap-3 overflow-x-scroll px-2 text-xl whitespace-nowrap'
      }
    >
      {generationList.map((generationName, i) => (
        <Link
          href={`/${lang}/${basePath}/${generationName}`}
          key={i}
          className={`rounded-full p-2 px-4 ${generationName === generation ? 'border-4 border-green-700' : 'border-2'} text-sm transition-all`}
        >
          {generationName}
        </Link>
      ))}
    </div>
  )
}
