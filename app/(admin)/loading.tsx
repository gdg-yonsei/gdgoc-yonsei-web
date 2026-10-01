import LoadingSpinner from '@/app/components/admin/loading-spinner'

export default function Loading() {
  return (
    <div
      className={
        'fixed top-0 left-0 z-40 flex h-screen w-screen items-center justify-center'
      }
    >
      <LoadingSpinner />
    </div>
  )
}
