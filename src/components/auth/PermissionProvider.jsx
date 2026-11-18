"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  getAllowedModules,
  getFirstAllowedRoute,
  hasPermission,
} from "@/lib/permissions";

const PermissionContext = createContext(null);

export function PermissionProvider({ user, children }) {
  const value = useMemo(
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
