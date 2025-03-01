import GenerationButtonGroup from '@/app/components/generation-button-group'
import { getGenerations } from '@/lib/fetcher/get-generations'

export default function StageButtonGroup({
  generationsData,
}: {
  generationsData: Awaited<ReturnType<typeof getGenerations>>
}) {
  return (
    <div className={'flex items-center justify-between p-4'}>
      <p className={'text-2xl font-semibold'}>Stage</p>
      <GenerationButtonGroup
        generations={generationsData.map((data) => data.name)}
      />
    </div>
  )
}
