'use client'

import { useAtom } from 'jotai'
import { generationState } from '@/lib/atoms'
import { getProjects } from '@/lib/fetcher/get-projects'

export default function ProjectsList({
  projectsData,
}: {
  projectsData: Awaited<ReturnType<typeof getProjects>>
}) {
  const [generation] = useAtom(generationState)

  const projects = projectsData.filter((data) => data.name === generation)[0]

  console.log(projects)

  return (
    <div>
      <div>Project List</div>
    </div>
  )
}
