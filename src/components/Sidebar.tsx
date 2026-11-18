"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  collapseIcon,
  sidebar1Icon,
  sidebar2Icon,
  sidebar3Icon,
  sidebar4Icon,
  sidebar5Icon,
  MobilemenuIcon,
} from "@/utils/svgicon";
import { usePermissions } from "@/components/auth/PermissionProvider";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  closeMobileMenu?: () => void;
  isMobile?: boolean;
}
const NAV_ITEMS = [
  // { id: "dashboard", label: "Dashboard", icon: sidebar1Icon, href: "/dashboard" },
  {
    id: "trainees",
    label: "Trainees",
    icon: sidebar2Icon,
    href: "/dashboard/trainees",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: sidebar3Icon,
    href: "/dashboard/transactions",
  },
  {
    id: "program-management",
    label: "Programs",
    icon: sidebar4Icon,
    href: "/dashboard/program-management",
  },
  { id: "users", label: "Users", icon: sidebar5Icon, href: "/dashboard/users" },
] as const;
const isCurrentPath = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/dashboard/trainees") {
    return (
      pathname.startsWith("/dashboard/trainees") ||
      pathname.startsWith("/dashboard/add-trainee")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  closeMobileMenu,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { allowedModules } = usePermissions();
  const CollapseIcon = collapseIcon;

  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) =>
      allowedModules.some((module) => module.id === item.id),
    );
  }, [allowedModules]);
  return (
    <aside
      className={`flex flex-col bg-[#08090c] text-zinc-400 transition-all duration-300 ${
        isMobile
          ? "relative z-50 h-full w-[272px] max-w-[84vw]"
          : `h-full shrink-0 z-30 ${isCollapsed ? "w-[72px]" : "w-56"}`
      }`}
    >
      <div
        className={`flex h-14 items-center border-b border-zinc-800 ${
          isCollapsed && !isMobile
            ? "justify-center px-0"
            : "justify-between px-4"
        }`}
      >
        {isMobile ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#111214]">
                <MobilemenuIcon className="h-5 w-5 shrink-0 object-contain" />
              </span>
              <span className="truncate text-[18px] font-bold tracking-wide text-white">
                Ignited code art
              </span>
            </div>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#111214] text-zinc-300 transition hover:bg-zinc-800 cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#111214] transition hover:bg-zinc-800 cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <CollapseIcon className="h-4.5 w-4.5 shrink-0 object-contain" />
          </button>
        )}
      </div>

      <nav
        className={`flex-1 overflow-y-auto ${
          isMobile
            ? "space-y-2 px-4 py-5" 
            : isCollapsed
              ? "space-y-2.5 px-3 py-4 flex flex-col items-center"
              : "space-y-2 px-3 py-4"
        }`}
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isCurrentPath(pathname, item.href);
          // const isSameDestination = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                closeMobileMenu?.();
              }}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center rounded-xl transition-all duration-200 ${
                isCollapsed && !isMobile
                  ? "h-11 w-11 justify-center mx-auto"
                  : "w-full gap-3 px-3.5 py-3 text-[15px]"
              } ${
                isActive
                  ? "bg-[#ff5b21] text-white font-bold shadow-sm"
                  : "text-white font-semibold hover:bg-[#ff5b21] hover:text-white"
              }`}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0 text-white" />

              {(!isCollapsed || isMobile) && (
                <span className="truncate whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
