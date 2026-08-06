import BackToPageButton from '@/app/components/back-to-page-button'

export default function Unauthorized() {
  return (
    <div
      className={
        'flex h-screen w-screen items-center justify-center bg-neutral-100 p-4'
      }
    >
      <div
        className={
          'flex w-full max-w-xl flex-col gap-2 rounded-xl bg-white p-8'
        }
      >
        <h2 className={'text-2xl font-bold lg:text-4xl'}>401 Unauthorized</h2>
        <p>You are not authorized to access this resource.</p>
        <BackToPageButton />
      </div>
    </div>
  )
}
