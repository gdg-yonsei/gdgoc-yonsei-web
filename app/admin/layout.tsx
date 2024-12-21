import { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import Header from "@/app/admin/header";
import JotaiProvider from "@/app/components/jotai-provider";
import Sidebar from "@/app/admin/sidebar";

export const metadata: Metadata = {
  title: "GYMS",
  description:
    "Google Developer Group on Campus Yonsei University Management System",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return redirect("/auth/sign-in");
  }
  return (
    <>
      <Header />
      <JotaiProvider>
        <Sidebar />
        {children}
      </JotaiProvider>
    </>
  );
}
