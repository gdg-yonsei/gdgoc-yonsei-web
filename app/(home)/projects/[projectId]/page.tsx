export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  return (
    <div className={'w-full min-h-screen pt-20'}>
      <div>Project Page {projectId}</div>
    </div>
  )
}
