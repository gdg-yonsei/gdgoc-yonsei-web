import { SignOutButton } from "@/app/components/auth/sign-out-button";
import RegisterPasskeyButton from "@/app/components/auth/register-passkey-button";
import { Suspense } from "react";
import UserProfile from "@/app/admin/user-profile";

export default function AdminPage() {
  return (
    <div
      className={
        "w-full h-screen flex flex-col items-center justify-center gap-2"
      }
    >
      <div className={"text-3xl font-bold"}>Admin Page</div>
      <div className={"flex flex-col gap-2 items-center justify-center"}>
        <SignOutButton />
        <RegisterPasskeyButton />
      </div>
      <Suspense
        fallback={
          <p className={"p-2 rounded-lg bg-white shadow-xl"}>Loading...</p>
        }
      >
        <UserProfile />
      </Suspense>
    </div>
  );
}
