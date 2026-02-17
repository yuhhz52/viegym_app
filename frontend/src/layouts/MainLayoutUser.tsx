import Sidebar from "@/components/Sidebar";
import { Outlet} from "react-router-dom";


export default function MainLayoutUser() {
  return (
    <>
     <Sidebar />
      <main className="flex-1 ml-[240px] bg-gray-50 min-h-screen">
      <Outlet />
      </main>
    </>
  );
}
