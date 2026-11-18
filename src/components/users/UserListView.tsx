"use client";

import { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import {
  Search,
  Plus,
  ChevronDown,
  Eye,
  EyeOff,
  MoreVertical,
  X,
} from "lucide-react";
import { Input } from "antd";
import { ArrowdownIcon, ArrowupIcon } from "@/utils/svgicon";
import { TableSkeleton } from "@/components/ui/Loader";
import TableScrollContainer from "@/components/ui/TableScrollContainer";
import ActionDropdown from "@/components/ui/ActionDropdown";
import type { User } from "./UserTypes";

interface UserListViewProps {
  users: User[];
  isLoading?: boolean;
  search: string;
  statusFilter: string;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onPageChange: (page: number) => void;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
  onSort?: (key: string) => void;
}

export default function UserListView({
  users,
  isLoading = false,
  search,
  statusFilter,
  currentPage,
  itemsPerPage,
  totalPages,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  sortConfig = null,
  onSort,
}: UserListViewProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const rawSecret = process.env.NEXT_PUBLIC_CRYPTO_SECRET || "";
  const secret = rawSecret.replace(/^['"]|['"]$/g, "");
  const possibleSecrets = [secret, rawSecret];
  // console.log(possibleSecrets,"kjhijh")

  const decryptTokenForPassword = (token?: string) => {
    if (!token) return "No Password Set";

    let decrypted = "";
    for (const s of possibleSecrets) {
      try {
        const bytes = CryptoJS.AES.decrypt(token, s);
        decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (decrypted) break; // Found the right key!
      } catch {
        // Ignore and try next key
      }
    }

    if (!decrypted) {
      return token; // It wasn't encrypted with any known key, return original hash
    }

    try {
      const parsed = JSON.parse(decrypted);
      return typeof parsed === "string" ? parsed : decrypted;
    } catch {
      return decrypted; // fallback if it's not JSON
    }
  };

  // Active dropdown and password reveals
  const [activeDropdownUserId, setActiveDropdownUserId] = useState<
    string | null
  >(null);
  const [revealedPasswordUserIds, setRevealedPasswordUserIds] = useState<
    string[]
  >([]);
  const [expandedUserIds, setExpandedUserIds] = useState<string[]>([]);

  // Click outside closing logic
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      if (!target.closest(".status-dropdown-container")) {
        setIsStatusDropdownOpen(false);
      }

    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  const paginatedUsers = users;

  const handleTogglePassword = (userId: string) => {
    setRevealedPasswordUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleToggleExpandCard = (userId: string) => {
    setExpandedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setActiveDropdownUserId(null);
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      {/* Title block */}
      <div>
        <h1 className="text-[22px] font-bold text-[#1f1f1f]">
          User Management
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage system users and their access permissions.
        </p>
      </div>

      {/* Desktop Controls */}
      <div className="relative z-30 hidden md:flex flex-row items-center justify-between gap-3 bg-transparent">
        <div className="relative w-full md:max-w-[290px]">
          <Input
            value={search}
            onChange={(event) => {
              onSearchChange(event.target.value);
            }}
            placeholder="Search...."
            allowClear={true}
            prefix={<Search className="h-4 w-4 text-[#ff5b21] mr-1.5" />}
            style={{ borderRadius: "10px", height: "40px" }}
            className="w-full !border-[#dedede] bg-white hover:!border-[#ff5b21] focus-within:!border-[#ff5b21] focus-within:!shadow-none [&>input]:text-sm [&>input]:text-[#333] [&>input]:placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 justify-end">
          <div className="status-dropdown-container relative shrink-0 h-[38px] z-40">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="inline-flex items-center justify-between gap-2.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition shadow-sm h-full select-none cursor-pointer min-w-[90px]"
            >
              <span>{statusFilter === "" ? "Status" : statusFilter}</span>
              {statusFilter ? (
                <X
                  className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 transition shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusFilterChange("");
                  }}
                />
              ) : (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 shrink-0 ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                {[
                  { label: "All Status", value: "" },
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onStatusFilterChange(item.value);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`block w-full px-3.5 py-2 text-left text-xs transition cursor-pointer font-semibold ${
                      statusFilter === item.value
                        ? "bg-[#ff5b21]/5 text-[#ff5b21]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onAddUser}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ff5b21] hover:bg-[#e04f1a] px-4 py-2 text-xs font-semibold text-white transition shadow-sm cursor-pointer h-[38px] select-none"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Mobile controls */}
      <div className="relative z-30 flex flex-col gap-2.5 md:hidden w-full">
        <div className="flex items-center gap-2.5 w-full">
          <div className="relative flex-1 flex items-center border border-gray-200 bg-white rounded-xl px-3 py-2.5 focus-within:border-[#ff5b21] transition">
            <Search className="h-4 w-4 text-[#ff5b21] shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                onSearchChange(e.target.value);
              }}
              className="text-xs text-gray-800 bg-transparent border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-400 w-full"
            />
          </div>

          <div className="status-dropdown-container relative shrink-0 h-10 z-40">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="inline-flex items-center justify-between gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition shadow-sm h-full select-none cursor-pointer"
            >
              {statusFilter === "" ? "Status" : statusFilter}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 max-h-48 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                {[
                  { label: "All Status", value: "" },
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onStatusFilterChange(item.value);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-xs font-semibold ${
                      statusFilter === item.value
                        ? "bg-[#ff5b21]/5 text-[#ff5b21]"
                        : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onAddUser}
          className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#ff5b21] hover:bg-[#e04f1a] py-3 text-xs font-bold text-white transition shadow-sm select-none"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Desktop Users Table Grid */}
      <div className="hidden bg-white rounded-2xl overflow-hidden shadow-none md:block select-none">
        <TableScrollContainer>

          <table className="w-full text-left min-w-[1020px] table-fixed select-none relative">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "230px" }} />
              <col style={{ width: "210px" }} />
              <col style={{ width: "130px" }} />
              <col />
              <col style={{ width: "110px" }} />
              <col style={{ width: "80px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 shadow-xs">
              <tr className="bg-[#0b0b0b] text-[11px] font-semibold tracking-wider text-white">
                <th className="px-5 py-4 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  #
                </th>
                <th className="px-5 py-4 bg-[#0b0b0b] sticky top-0 z-20">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-transparent border-0 outline-none text-left p-0 text-inherit"
                  >
                    <span>Name</span>
                    <div className="flex flex-col gap-[2px] shrink-0">
                      <ArrowupIcon
                        className={`w-[8px] h-[5px] transition-colors ${
                          sortConfig?.key === "name" &&
                          sortConfig.direction === "asc"
                            ? "text-[#fe5200]"
                            : "text-[#c8c8c8]"
                        }`}
                      />
                      <ArrowdownIcon
                        className={`w-[8px] h-[5px] transition-colors ${
                          sortConfig?.key === "name" &&
                          sortConfig.direction === "desc"
                            ? "text-[#fe5200]"
                            : "text-[#c8c8c8]"
                        }`}
                      />
                    </div>
                  </button>
                </th>
                <th className="px-5 py-4 bg-[#0b0b0b] sticky top-0 z-20">
                  Password
                </th>
                <th className="px-5 py-4 bg-[#0b0b0b] sticky top-0 z-20">
                  <button
                    type="button"
                    onClick={() => handleSort("role")}
                    className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-transparent border-0 outline-none text-left p-0 text-inherit"
                  >
                    <span>Role</span>
                    <div className="flex flex-col gap-[2px] shrink-0">
                      <ArrowupIcon
                        className={`w-[8px] h-[5px] transition-colors ${
                          sortConfig?.key === "role" &&
                          sortConfig.direction === "asc"
                            ? "text-[#fe5200]"
                            : "text-[#c8c8c8]"
                        }`}
                      />
                      <ArrowdownIcon
                        className={`w-[8px] h-[5px] transition-colors ${
                          sortConfig?.key === "role" &&
                          sortConfig.direction === "desc"
                            ? "text-[#fe5200]"
                            : "text-[#c8c8c8]"
                        }`}
                      />
                    </div>
                  </button>
                </th>
                <th className="px-5 py-4 bg-[#0b0b0b] sticky top-0 z-20">
                  <button
                    type="button"
                    onClick={() => handleSort("permission")}
                    className="inline-flex items-center gap-1.5 cursor-pointer select-none bg-transparent border-0 outline-none text-left p-0 text-inherit"
                  >
                    <span>Permission</span>
                    <div className="flex flex-col gap-[2px] shrink-0">
                      <ArrowupIcon
                        className={`w-[8px] h-[5px] transition-colors ${
                          sortConfig?.key === "permission" &&
                          sortConfig.direction === "asc"
                            ? "text-[#fe5200]"
                            : "text-[#c8c8c8]"
                        }`}
                      />
                      <ArrowdownIcon
                        className={`w-[8px] h-[5px] transition-colors ${
                          sortConfig?.key === "permission" &&
                          sortConfig.direction === "desc"
                            ? "text-[#fe5200]"
                            : "text-[#c8c8c8]"
                        }`}
                      />
                    </div>
                  </button>
                </th>
                <th className="px-5 py-4 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Status
                </th>
                <th className="px-5 py-4 text-center bg-[#0b0b0b] sticky top-0 z-20">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
                      <span className="text-xs text-gray-400 font-medium">
                        Loading users…
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-400 font-medium"
                  >
                    No users found matching the filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, index) => {
                  const isPasswordShown = revealedPasswordUserIds.includes(
                    u.id,
                  );
                  const decrypted = decryptTokenForPassword(u.password);
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50/80 transition ${
                        index === paginatedUsers.length - 1
                          ? "[&>td]:border-b-0"
                          : "[&>td]:border-b [&>td]:border-[#E5E7EB]"
                      }`}
                    >
                      <td className="px-5 py-4.5 text-center text-black font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full ${u.avatarBg} flex items-center justify-center text-xs font-bold uppercase shrink-0`}
                          >
                            {u.initial}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-gray-900 leading-tight truncate">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="font-mono font-medium tracking-wide text-gray-800 truncate"
                            title={isPasswordShown ? decrypted : undefined}
                          >
                            {isPasswordShown
                              ? decrypted
                              : decrypted === "No Password Set"
                                ? "No Password Set"
                                : "*".repeat(
                                    Math.min(10, Math.max(6, decrypted.length)),
                                  )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePassword(u.id)}
                            className="text-gray-400 hover:text-gray-600 transition cursor-pointer shrink-0"
                          >
                            {isPasswordShown ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4.5 font-bold text-gray-900 whitespace-nowrap">
                        {u.role}
                      </td>
                      <td className="px-5 py-4.5">
                        <div className="flex flex-wrap gap-1.5">
                          {u.permissions.map((p) => (
                            <span
                              key={p}
                              className="bg-[#f0f0f0] text-gray-900 text-xs px-3 py-1 rounded-full whitespace-nowrap"
                            >
                              {p}
                            </span>
                          ))}
                          {u.permissions.length === 0 && (
                            <span className="text-gray-400 font-semibold">
                              No permissions
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                            u.status === "Active"
                              ? "bg-[#e6f9f0] text-[#10b981]"
                              : "bg-[#fee2e2] text-[#ef4444]"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-4.5 text-center">
                        <ActionDropdown
                          open={activeDropdownUserId === u.id}
                          onOpenChange={(isOpen) =>
                            setActiveDropdownUserId(isOpen ? u.id : null)
                          }
                          trigger={<MoreVertical className="h-4 w-4" />}
                          triggerClassName="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer transition inline-flex items-center justify-center"
                          menuClassName="w-24 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 text-center shadow-[0_4px_20px_rgba(0,0,0,0.12)] animate-in fade-in duration-150"
                          ariaLabel={`Open actions for ${u.firstName} ${u.lastName}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownUserId(null);
                              onEditUser({
                                ...u,
                                password: decryptTokenForPassword(u.password),
                              });
                            }}
                            className="block w-full px-3 py-2 text-center text-xs font-semibold text-[#2d2d2d] transition hover:bg-[#f8f8f8] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownUserId(null);
                              onDeleteUser(u);
                            }}
                            className="block w-full px-3 py-2 text-center text-xs font-semibold text-red-600 hover:bg-red-50/50 cursor-pointer"
                          >
                            Delete
                          </button>
                        </ActionDropdown>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScrollContainer>
      </div>

      {/* Mobile Users List Cards */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="bg-white border border-[#ececec] rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff5b21] border-t-transparent" />
            <span className="text-xs text-gray-400 font-medium">
              Loading users…
            </span>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="bg-white border border-[#ececec] rounded-2xl p-6 text-center text-gray-400 font-semibold text-xs shadow-sm">
            No users found matching the filters.
          </div>
        ) : (
          paginatedUsers.map((u) => {
            const isExpanded = expandedUserIds.includes(u.id);
            const isPasswordShown = revealedPasswordUserIds.includes(u.id);

            return (
              <div
                key={u.id}
                className="bg-white border border-[#ececec] rounded-2xl p-4 shadow-sm flex flex-col gap-4 relative animate-in fade-in duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full ${u.avatarBg} flex items-center justify-center text-xs font-bold uppercase shrink-0`}
                    >
                      {u.initial}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm leading-tight">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <ActionDropdown
                    open={activeDropdownUserId === u.id}
                    onOpenChange={(isOpen) =>
                      setActiveDropdownUserId(isOpen ? u.id : null)
                    }
                    trigger={<MoreVertical className="h-4 w-4" />}
                    triggerClassName="p-1.5 hover:bg-gray-100 rounded-full cursor-pointer text-gray-400 hover:text-gray-950 transition"
                    menuClassName="w-24 rounded-xl border border-gray-100 bg-white py-1 text-left shadow-lg"
                    ariaLabel={`Open actions for ${u.firstName} ${u.lastName}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdownUserId(null);
                        onEditUser({
                          ...u,
                          password: decryptTokenForPassword(u.password),
                        });
                      }}
                      className="block w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdownUserId(null);
                        onDeleteUser(u);
                      }}
                      className="block w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50/50 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </ActionDropdown>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#fcfcfd] border border-gray-50 p-3 rounded-xl">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Role
                    </p>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">
                      {u.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Status
                    </p>
                    <div className="mt-0.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[9px] font-semibold rounded-full ${
                          u.status === "Active"
                            ? "bg-[#e0e7ff] text-[#4f46e5]"
                            : "bg-[#f8d4d4] text-[#d92d2d]"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-4 pt-1 border-t border-dashed border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
                        Password
                      </p>
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-mono text-xs font-medium text-gray-800 truncate"
                          title={isPasswordShown ? decryptTokenForPassword(u.password) : undefined}
                        >
                          {isPasswordShown
                            ? decryptTokenForPassword(u.password)
                            : decryptTokenForPassword(u.password) === "No Password Set"
                              ? "No Password Set"
                              : "*".repeat(
                                  Math.min(
                                    10,
                                    Math.max(
                                      6,
                                      decryptTokenForPassword(u.password).length,
                                    ),
                                  ),
                                )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTogglePassword(u.id)}
                          className="text-gray-400 hover:text-gray-600 transition shrink-0 cursor-pointer"
                        >
                          {isPasswordShown ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">
                        Permission
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {u.permissions.map((p) => (
                          <span
                            key={p}
                            className="bg-[#f0f0f0] text-gray-900 text-[10px] font-normal px-3 py-1 rounded-full whitespace-nowrap"
                          >
                            {p}
                          </span>
                        ))}
                        {u.permissions.length === 0 && (
                          <span className="text-gray-400 text-[10px] font-medium">
                            No permissions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleExpandCard(u.id)}
                  className="w-full bg-[#fcfcfd] border-t border-gray-100 py-2.5 text-center text-xs font-semibold text-[#ff5b21] hover:text-[#e04f1a] transition select-none cursor-pointer rounded-b-2xl"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination component */}
      <div className="flex flex-row items-center justify-between border-t border-gray-100 pt-5 select-none text-xs font-semibold">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-900 transition disabled:opacity-40 disabled:hover:text-gray-500 select-none cursor-pointer"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-1.5">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-2 text-gray-400">
                  ...
                </span>
              );
            }
            const isSelected = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePageChange(p as number)}
                className={`h-7 w-7 rounded-[5px] flex items-center justify-center text-center text-xs transition cursor-pointer select-none ${
                  isSelected
                    ? "bg-[#ff5b21] text-white font-bold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-900 transition disabled:opacity-40 disabled:hover:text-gray-500 select-none cursor-pointer"
        >
          Next →
        </button>
      </div>
    </>
  );
}

