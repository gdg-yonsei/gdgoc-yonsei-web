'use client'

import { generationState } from '@/lib/atoms'
import { useAtom } from 'jotai'
import { useEffect } from 'react'

export default function GenerationButtonGroup({
  generations,
}: {
  generations: string[]
}) {
  const [generation, setGeneration] = useAtom(generationState)

  useEffect(() => {
    if (generations.length > 0) {
      setGeneration(generations[generations.length - 1])
    }
  }, [generations, setGeneration])

  return (
    <div
      className={
        'flex h-24 items-center gap-3 overflow-x-scroll px-2 text-xl whitespace-nowrap'
      }
    >
      {generations.map((data, i) => (
        <button
          type={'button'}
          key={i}
          className={`rounded-full p-2 px-4 ${generation === data ? 'border-4 border-green-700' : 'border-2'} text-sm transition-all`}
          onClick={() => setGeneration(data)}
        >
          {data}
        </button>
      ))}
    </div>
  )
}
