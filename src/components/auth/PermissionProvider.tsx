"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { TraineeUser } from "@/lib/api/types";
import {
  getAllowedModules,
  getFirstAllowedRoute,
  hasPermission,
  type AppPermission,
} from "@/lib/permissions";

interface PermissionContextValue {
  user: TraineeUser;
  can: (permission: AppPermission) => boolean;
  allowedModules: ReturnType<typeof getAllowedModules>;
  firstAllowedRoute: string | null;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  user,
  children,
}: {
  user: TraineeUser;
  children: React.ReactNode;
}) {
  const value = useMemo<PermissionContextValue>(
    () => ({
      user,
      can: (permission) => hasPermission(user, permission),
      allowedModules: getAllowedModules(user),
      firstAllowedRoute: getFirstAllowedRoute(user),
    }),
    [user],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used inside PermissionProvider.");
  }
  return context;
};
