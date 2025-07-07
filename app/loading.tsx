import LoadingSpinner from '@/app/components/loading-spinner'

export default function Loading() {
  return (
    <div
      className={
        'bg-gdg-white/50 fixed top-0 left-0 z-10 flex h-screen w-screen items-center justify-center p-4'
      }
    >
      <div>
        <LoadingSpinner />
      </div>
    </div>
  )
}
