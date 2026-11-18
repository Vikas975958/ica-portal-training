export const PERMISSION_MODULES = [
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
];

const isEnabled = (value) =>
  value === true || value === 1 || value === "1" || value === "true";

export const hasPermission = (user, permission) =>
  Boolean(user && isEnabled(user[permission]));

export const getAllowedModules = (user) =>
  PERMISSION_MODULES.filter((module) =>
    hasPermission(user, module.permission),
  );

export const getFirstAllowedRoute = (user) =>
  getAllowedModules(user)[0]?.href || null;

export const getModuleForPath = (pathname) =>
  PERMISSION_MODULES.find((item) => item.matches(pathname)) || null;

export const canAccessDashboardPath = (user, pathname) => {
  if (!pathname.startsWith("/dashboard")) return true;
  const routeModule = getModuleForPath(pathname);
  return routeModule ? hasPermission(user, routeModule.permission) : false;
};

export const parseStoredUser = (value) => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  return parseStoredUser(window.localStorage.getItem("user"));
};
