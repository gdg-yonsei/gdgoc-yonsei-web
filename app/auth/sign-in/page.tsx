import GDGoCYonseiLogo from '@/app/components/gdgoc-yonsei-logo'
import SignInOptions from '@/app/components/auth/sign-in-options'

export default function SignInPage() {
  return (
    <div
      className={
        'w-screen h-screen flex flex-col items-center justify-center p-4'
      }
    >
      <div
        className={
          'rounded-xl md:rounded-2xl max-w-3xl bg-white shadow-xl w-full h-1/2 relative flex flex-col items-center p-8'
        }
      >
        <div className="flex flex-col gap-2 md:flex-row items-center md:justify-around justify-center w-full h-full relative">
          <GDGoCYonseiLogo className={'md:absolute top-0 left-0 mr-auto'} />
          <div className={'flex gap-4 flex-col md:w-2/3 w-full'}>
            <div
              className={
                'flex flex-col gap-1 items-start text-2xl md:text-4xl font-bold'
              }
            >
              <h1>GDGoC Yonsei</h1>
              <h1>Management System</h1>
            </div>
          </div>
          <SignInOptions />
        </div>
        <p className={'text-xs'}>
          To log in using a passkey, you must first sign in with GitHub and then
          register a passkey.
        </p>
      </div>
    </div>
  )
}
