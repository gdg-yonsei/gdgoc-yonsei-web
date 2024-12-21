import AdminDefaultLayout from "@/app/components/admin-default-layout";
import UserProfile from "@/app/admin/user-profile";
import { Suspense } from "react";

export default function ProfilePage() {
  return (
    <AdminDefaultLayout className={"p-4"}>
      <div>Profile Page</div>
      <Suspense
        fallback={
          <p className={"p-2 rounded-lg bg-white shadow-xl text-center"}>
            Loading...
          </p>
        }
      >
        <UserProfile />
      </Suspense>
    </AdminDefaultLayout>
  );
}
