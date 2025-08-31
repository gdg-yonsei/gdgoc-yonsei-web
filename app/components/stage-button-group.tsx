import GenerationButtonGroup from '@/app/components/generation-button-group'
import getGenerationList from '@/app/(home)/[lang]/member/[generation]/getGenerationList'

export default async function StageButtonGroup({
  generation,
  lang,
  basePath,
}: {
  generation: string
  lang: string
  basePath: string
}) {
  const generationList = await getGenerationList()

  return (
    <div className={'flex w-full'}>
      <div
        className={
          'mx-auto flex w-full max-w-4xl items-center justify-between p-4'
        }
      >
        <p className={'pr-2 text-2xl font-semibold'}>Generation</p>
        <GenerationButtonGroup
          generationList={generationList.reverse().map((data) => data.name)}
          generation={generation}
          lang={lang}
          basePath={basePath}
        />
      </div>
    </div>
  )
}
