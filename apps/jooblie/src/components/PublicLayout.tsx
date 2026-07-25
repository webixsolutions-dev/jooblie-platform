import { Outlet } from "react-router-dom";

import { PublicFooter } from "./PublicFooter";
import { PublicNavbar } from "./PublicNavbar";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-background">
      <PublicNavbar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
