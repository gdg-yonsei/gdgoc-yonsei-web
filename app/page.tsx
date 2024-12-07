import SignInWithGithubButton from "@/app/components/auth/sign-in-button";

export default function HomePage() {
  return (
    <div className={"w-full min-h-screen flex items-center justify-center"}>
      <div className={"text-4xl font-bold"}>GDGoC Yonsei University</div>
      <SignInWithGithubButton />
    </div>
  );
}
