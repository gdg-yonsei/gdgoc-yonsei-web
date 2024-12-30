import BackToPageButton from '@/app/components/back-to-page-button'

export default function Unauthorized() {
  return (
    <div
      className={
        'w-screen h-screen flex items-center justify-center bg-neutral-100 p-4'
      }
    >
      <div
        className={
          'p-8 rounded-xl bg-white flex flex-col gap-2 w-full max-w-xl'
        }
      >
        <h2 className={'text-2xl font-bold lg:text-4xl'}>401 Unauthorized</h2>
        <p>You are not authorized to access this resource.</p>
        <BackToPageButton />
      </div>
    </div>
  )
}
