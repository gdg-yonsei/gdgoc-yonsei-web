import Link from "next/link";
import ToggleMenubarButton from "@/app/admin/toggle-menubar-button";
import MenuBar from "@/app/admin/menu-bar";

export default function Header() {
  return (
    <div className={"w-full fixed top-0 left-0 flex flex-col z-10"}>
      <div className={"flex justify-between items-center p-4 bg-neutral-100"}>
        <Link href={"/admin"} className={"text-xl font-bold"}>
          GYMS
        </Link>
        <ToggleMenubarButton />
      </div>
      <MenuBar />
    </div>
  );
}
