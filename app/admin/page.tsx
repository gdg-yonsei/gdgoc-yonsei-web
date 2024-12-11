import { SignOutButton } from "@/app/components/auth/sign-out-button";
import RegisterPasskeyButton from "@/app/components/auth/register-passkey-button";

export default function AdminPage() {
  return (
    <div
      className={"w-full h-screen flex flex-col items-center justify-center"}
    >
      <div className={"text-3xl font-bold"}>Admin Page</div>
      <div className={"flex flex-col gap-2 items-center justify-center"}>
        <SignOutButton />
        <RegisterPasskeyButton />
      </div>
    </div>
  );
}
