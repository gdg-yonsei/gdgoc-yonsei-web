import { SignOutButton } from "@/app/components/auth/sign-out-button";
import RegisterPasskeyButton from "@/app/components/auth/register-passkey-button";
import AdminDefaultLayout from "@/app/components/admin-default-layout";

export default function AdminPage() {
  return (
    <AdminDefaultLayout className={"w-full flex flex-col p-4 gap-4"}>
      <div className={"text-3xl font-bold"}>Admin Page</div>
      <div className={"flex flex-col gap-2 items-center justify-center"}>
        <SignOutButton />
        <RegisterPasskeyButton />
      </div>
    </AdminDefaultLayout>
  );
}
