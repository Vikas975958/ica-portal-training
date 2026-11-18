"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PermissionProvider } from "@/components/auth/PermissionProvider";
import { canAccessDashboardPath, getFirstAllowedRoute, getStoredUser } from "@/lib/permissions";
// interface PendingNavigation {
//   from: string;
//   startedAt: number;
// }

// const MINIMUM_LOADER_TIME_MS = 300;
// const NAVIGATION_TIMEOUT_MS = 15000;

// const BYPASS_PATHS = [
//   "/dashboard",
//   "/dashboard/trainees",
//   "/dashboard/program-management",
//   "/dashboard/users",
//   "/dashboard/transactions",
// ];

const dummyUser = {
  id: "",
  first_name: "",
  last_name: "",
  email: "",
  status: "inactive",
  perm_dashboard: false,
  perm_trainees: false,
  perm_transaction: false,
  perm_program: false,
  perm_user: false
};
export default function DashboardLayout({
  children
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState({
    status: "checking",
    user: null,
    pathname
  });
  useEffect(() => {
    const checkAccess = () => {
      const token = localStorage.getItem("accessToken");
      const user = getStoredUser();
      if (!token || !user) {
        setSession(prev => {
          if (prev.status === "checking" && prev.user === null) {
            return prev;
          }
          return {
            status: "checking",
            user: null,
            pathname
          };
        });
        router.replace("/");
        return;
      }
      if (!canAccessDashboardPath(user, pathname)) {
        const firstAllowedRoute = getFirstAllowedRoute(user);
        if (firstAllowedRoute && firstAllowedRoute !== pathname) {
          router.replace(firstAllowedRoute);
          return;
        }
        setSession(prev => {
          if (prev.status === "no-access" && prev.pathname === pathname && prev.user?.id === user.id) {
            return prev;
          }
          return {
            status: "no-access",
            user,
            pathname
          };
        });
        return;
      }
      setSession(prev => {
        if (prev.status === "authorized" && prev.pathname === pathname && prev.user?.id === user.id) {
          return prev;
        }
        return {
          status: "authorized",
          user,
          pathname
        };
      });
    };
    checkAccess();
    const handleLogout = () => {
      setSession({
        status: "checking",
        user: null,
        pathname
      });
      router.replace("/");
    };
    window.addEventListener("storage", checkAccess);
    window.addEventListener("auth_login", checkAccess);
    window.addEventListener("permissions_updated", checkAccess);
    window.addEventListener("auth_logout", handleLogout);
    return () => {
      window.removeEventListener("storage", checkAccess);
      window.removeEventListener("auth_login", checkAccess);
      window.removeEventListener("permissions_updated", checkAccess);
      window.removeEventListener("auth_logout", handleLogout);
    };
  }, [pathname, router]);
  const currentUser = session.user ?? dummyUser;
  return <PermissionProvider user={currentUser}>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-[#08090c] text-gray-800">
        <div className="hidden h-full shrink-0 md:block">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {mobileMenuOpen && <div className="fixed inset-0 z-40 flex md:hidden">
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close sidebar" className="absolute inset-0 bg-black/60" />

            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} closeMobileMenu={() => setMobileMenuOpen(false)} isMobile />
          </div>}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#08090c]">
          <Header onMenuToggle={() => setMobileMenuOpen(prev => !prev)} />

          <div className="flex flex-1 flex-col overflow-hidden rounded-tl-[28px] bg-white">
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-3.5 pb-3.5 no-scrollbar md:p-6">
              {session.status === "no-access" ? <div className="flex min-h-full items-center justify-center p-6 text-center">
                  <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h1 className="text-xl font-bold text-gray-900">
                      No modules assigned
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                      Contact an administrator to assign at least one module to
                      your account.
                    </p>
                  </div>
                </div> : children}
            </main>
          </div>
        </div>
      </div>
    </PermissionProvider>;
}