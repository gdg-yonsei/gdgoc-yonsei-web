import GDGoCYonseiLogo from "@/app/components/gdgoc-yonsei-logo";
import SignInButton from "@/app/components/auth/sign-in-button";
import PasskeySignInButton from "@/app/components/auth/passkey-sign-in-button";

export default function SignInPage() {
  return (
    <div
      className={
        "w-screen h-screen flex flex-col items-center justify-center p-4"
      }
    >
      <div
        className={
          "rounded-xl md:rounded-2xl max-w-3xl bg-white shadow-xl w-full h-1/2 relative flex flex-col items-center p-8"
        }
      >
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center md:justify-around justify-center w-full h-full relative">
          <GDGoCYonseiLogo className={"md:absolute top-0 left-0 mr-auto"} />
          <div className={"flex gap-4 flex-col md:w-2/3 w-full"}>
            <div
              className={
                "flex flex-col gap-1 items-start text-2xl md:text-4xl font-bold"
              }
            >
              <h1>GDGoC Yonsei</h1>
              <h1>Management System</h1>
            </div>
          </div>
          <div className={"w-full md:w-1/3 flex flex-col gap-2"}>
            <SignInButton provider={"github"}>Sign In with Github</SignInButton>
            <PasskeySignInButton />
          </div>
        </div>
        <p className={"text-xs"}>
          To log in using a passkey, you must first sign in with GitHub and then
          register a passkey.
        </p>
      </div>
    </div>
  );
}
