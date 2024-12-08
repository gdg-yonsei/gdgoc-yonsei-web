import { SignOutButton } from "@/app/components/auth/sign-out-button";

export default function AdminPage() {
  return (
    <div
      className={"w-full h-screen flex flex-col items-center justify-center"}
    >
      <div className={"text-3xl font-bold"}>Admin Page</div>
      <SignOutButton />
    </div>
  );
}
