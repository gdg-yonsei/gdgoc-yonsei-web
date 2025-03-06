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
        'flex items-center gap-3 text-xl overflow-x-scroll h-24 whitespace-nowrap px-2'
      }
    >
      {generations.map((data, i) => (
        <button
          type={'button'}
          key={i}
          className={`p-2 rounded-xl ${generation === data ? 'ring-green-700 ring-4' : 'ring-2'} transition-all`}
          onClick={() => setGeneration(data)}
        >
          {data}
        </button>
      ))}
    </div>
  )
}
