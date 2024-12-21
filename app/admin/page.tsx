import AdminDefaultLayout from "@/app/components/admin/admin-default-layout";
import PageTitle from "@/app/components/admin/page-title";

export default function AdminPage() {
  return (
    <AdminDefaultLayout className={"w-full flex flex-col p-4 gap-4"}>
      <PageTitle>Home</PageTitle>
    </AdminDefaultLayout>
  );
}
