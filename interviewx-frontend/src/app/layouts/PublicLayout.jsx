import { Outlet } from "react-router-dom";
import Navbar from "@/shared/ui/Navbar/Navbar.jsx";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar variant="public" />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
