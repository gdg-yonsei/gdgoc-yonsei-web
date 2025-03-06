import GenerationButtonGroup from '@/app/components/generation-button-group'
import { getGenerations } from '@/lib/fetcher/get-generations'

export default function StageButtonGroup({
  generationsData,
}: {
  generationsData: Awaited<ReturnType<typeof getGenerations>>
}) {
  return (
    <div className={'w-full flex'}>
      <div
        className={
          'flex items-center justify-between p-4 w-full max-w-4xl mx-auto'
        }
      >
        <p className={'text-2xl font-semibold pr-2'}>Stage</p>
        <GenerationButtonGroup
          generations={generationsData.map((data) => data.name)}
        />
      </div>
    </div>
  )
}
