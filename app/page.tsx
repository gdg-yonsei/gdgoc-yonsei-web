import SignInWithGithubButton from "@/app/components/auth/sign-in-button";
import { auth } from "@/auth";
import { SignOutButton } from "@/app/components/auth/sign-out-button";

export default async function HomePage() {
  const session = await auth();
  return (
    <div
      className={
        "w-full min-h-screen flex items-center justify-center flex-col gap-2"
      }
    >
      <div className={"text-4xl font-bold"}>GDGoC Yonsei University</div>
      {session?.user?.id ? <SignOutButton /> : <SignInWithGithubButton />}
    </div>
  );
}
