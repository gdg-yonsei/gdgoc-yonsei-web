import Link from "next/link";
import ToggleMenubarButton from "@/app/admin/toggle-menubar-button";
import MenuBar from "@/app/admin/menu-bar";

export default function Header() {
  return (
    <div className={"w-full fixed top-0 left-0 flex flex-col z-10"}>
      <div className={"w-full bg-neutral-100 flex items-center justify-center"}>
        <div
          className={"flex justify-between items-center w-full max-w-4xl p-4"}
        >
          <Link href={"/admin"} className={"text-xl font-bold"}>
            GYMS
          </Link>
          <ToggleMenubarButton />
        </div>
      </div>
      <MenuBar />
    </div>
  );
}
