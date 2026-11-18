import type { TraineeUser } from "@/lib/api/types";

export type AppPermission =
  | "perm_dashboard"
  | "perm_trainees"
  | "perm_transaction"
  | "perm_program"
  | "perm_user";

export interface PermissionModule {
  id: "dashboard" | "trainees" | "transactions" | "program-management" | "users";
  label: "Dashboard" | "Trainees" | "Transaction" | "Program" | "User";
  permission: AppPermission;
  href: string;
  matches: (pathname: string) => boolean;
}

export const PERMISSION_MODULES: readonly PermissionModule[] = [
  // {
  //   id: "dashboard",
  //   label: "Dashboard",
  //   permission: "perm_dashboard",
  //   href: "/dashboard",
  //   matches: (pathname) => pathname === "/dashboard",
  // },
  {
    id: "trainees",
    label: "Trainees",
    permission: "perm_trainees",
    href: "/dashboard/trainees",
    matches: (pathname) =>
      pathname === "/dashboard/add-trainee" ||
      pathname.startsWith("/dashboard/trainees"),
  },
  {
    id: "transactions",
    label: "Transaction",
    permission: "perm_transaction",
    href: "/dashboard/transactions",
    matches: (pathname) => pathname.startsWith("/dashboard/transactions"),
  },
  {
    id: "program-management",
    label: "Program",
    permission: "perm_program",
    href: "/dashboard/program-management",
    matches: (pathname) =>
      pathname.startsWith("/dashboard/program-management"),
  },
  {
    id: "users",
    label: "User",
    permission: "perm_user",
    href: "/dashboard/users",
    matches: (pathname) => pathname.startsWith("/dashboard/users"),
  },
] as const;

const isEnabled = (value: unknown) =>
  value === true || value === 1 || value === "1" || value === "true";

export const hasPermission = (
  user: TraineeUser | null,
  permission: AppPermission,
) => Boolean(user && isEnabled(user[permission]));

export const getAllowedModules = (user: TraineeUser | null) =>
  PERMISSION_MODULES.filter((module) =>
    hasPermission(user, module.permission),
  );

export const getFirstAllowedRoute = (user: TraineeUser | null) =>
  getAllowedModules(user)[0]?.href || null;

export const getModuleForPath = (pathname: string) =>
  PERMISSION_MODULES.find((item) => item.matches(pathname)) || null;

export const canAccessDashboardPath = (
  user: TraineeUser | null,
  pathname: string,
) => {
  if (!pathname.startsWith("/dashboard")) return true;
  const routeModule = getModuleForPath(pathname);
  return routeModule ? hasPermission(user, routeModule.permission) : false;
};

export const parseStoredUser = (value: string | null): TraineeUser | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as TraineeUser;
  } catch {
    return null;
  }
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  return parseStoredUser(window.localStorage.getItem("user"));
};

