import GenerationButtonGroup from '@/app/components/generation-button-group'
import { getGenerations } from '@/lib/fetcher/get-generations'

export default function StageButtonGroup({
  generationsData,
}: {
  generationsData: Awaited<ReturnType<typeof getGenerations>>
}) {
  return (
    <div className={'flex w-full'}>
      <div
        className={
          'mx-auto flex w-full max-w-4xl items-center justify-between p-4'
        }
      >
        <p className={'pr-2 text-2xl font-semibold'}>Stage</p>
        <GenerationButtonGroup
          generations={generationsData.map((data) => data.name)}
        />
      </div>
    </div>
  )
}
