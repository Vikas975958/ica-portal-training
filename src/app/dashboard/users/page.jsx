"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import UserListView from "@/components/users/UserListView";
import UserFormView from "@/components/users/UserFormView";
import { DeleteUserModal } from "@/components/users/UserModals";
import { getAllUsers } from "@/api/get";
import { createTraineeUser } from "@/api/post";
import { updateTraineeUser } from "@/api/patch";
import { deleteTraineeUser } from "@/api/delete";
import { Loader2 } from "lucide-react";
import { useRequestDeduplicator } from "@/lib/hooks/useRequestDeduplicator";
import { toast } from "react-toastify";
const getErrorMessage = (error, fallback) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

// Mapper helpers
const mapBackendToUser = u => {
  const permissions = [];
  if (u.perm_dashboard) permissions.push("Dashboard");
  if (u.perm_trainees) permissions.push("Trainees");
  if (u.perm_transaction) permissions.push("Transaction");
  if (u.perm_program) permissions.push("Program");
  if (u.perm_user) permissions.push("User");
  const gradients = ["bg-purple-100 text-purple-700", "bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-pink-100 text-pink-700", "bg-cyan-100 text-cyan-700", "bg-orange-100 text-orange-700", "bg-indigo-100 text-indigo-700"];
  const charSum = (u.first_name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const avatarBg = gradients[Math.abs(charSum) % gradients.length];
  return {
    id: u.id,
    firstName: u.first_name || "",
    lastName: u.last_name || "",
    email: u.email || "",
    role: u.role || "Admin",
    permissions,
    status: u.status === "inactive" ? "Inactive" : "Active",
    avatarBg,
    initial: u.first_name ? u.first_name.charAt(0).toUpperCase() : "U",
    password: u.password || ""
  };
};
const mapUserToCreateDto = user => ({
  first_name: user.firstName,
  last_name: user.lastName,
  email: user.email,
  password: user.password || "Password@123",
  perm_dashboard: user.permissions.includes("Dashboard"),
  perm_trainees: user.permissions.includes("Trainees"),
  perm_transaction: user.permissions.includes("Transaction"),
  perm_program: user.permissions.includes("Program"),
  perm_user: user.permissions.includes("User")
});
const mapUserToUpdateDto = user => ({
  first_name: user.firstName,
  last_name: user.lastName,
  email: user.email,
  ...(user.password ? {
    password: user.password
  } : {}),
  role: user.role === "Superadmin" ? "Superadmin" : "Admin",
  status: user.status.toLowerCase() === "active" ? "active" : "inactive",
  perm_dashboard: user.permissions.includes("Dashboard"),
  perm_trainees: user.permissions.includes("Trainees"),
  perm_transaction: user.permissions.includes("Transaction"),
  perm_program: user.permissions.includes("Program"),
  perm_user: user.permissions.includes("User")
});
export default function UsersPage() {
  const [view, setView] = useState("list");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const {
    shouldFetch
  } = useRequestDeduplicator();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState(null);
  const handleSortChange = key => {
    setCurrentPage(1);
    setSortConfig(prev => {
      const direction = prev && prev.key === key && prev.direction === "asc" ? "desc" : "asc";
      return {
        key,
        direction
      };
    });
  };
  const handleStatusFilterChange = status => {
    setStatusFilter(status);
    setCurrentPage(1);
  };
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [search]);
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const sortByMap = {
        name: "name",
        role: "role",
        permission: "permission"
      };
      const params = {
        page: String(currentPage),
        limit: String(itemsPerPage),
        sortBy: sortConfig ? sortByMap[sortConfig.key] : "created_at",
        sortOrder: sortConfig ? sortConfig.direction.toUpperCase() : "DESC"
      };
      const searchWords = debouncedSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const isMultiWordSearch = searchWords.length > 1;
      if (isMultiWordSearch) {
        params.search = searchWords[0];
        params.limit = "200";
        params.page = "1";
      } else if (debouncedSearch) {
        params.search = debouncedSearch.trim();
      }
      if (statusFilter) {
        params.status = statusFilter.toLowerCase();
      }
      const response = await getAllUsers(params);
      if (response.success && response.data) {
        const responseData = response.data;
        let rawList = Array.isArray(responseData) ? responseData : responseData.users || [];

        // If multi-word search and first word returned 0 candidates, fallback to searching by last word
        if (isMultiWordSearch && rawList.length === 0) {
          const fallbackParams = {
            ...params,
            search: searchWords[searchWords.length - 1],
            limit: "200",
            page: "1"
          };
          const fallbackRes = await getAllUsers(fallbackParams);
          if (fallbackRes.success && fallbackRes.data) {
            const fallbackData = fallbackRes.data;
            rawList = Array.isArray(fallbackData) ? fallbackData : fallbackData.users || [];
          }
        }

        // Filter candidate users to ensure all search words match fullName or email
        if (isMultiWordSearch && rawList.length > 0) {
          rawList = rawList.filter(u => {
            const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
            const email = String(u.email || "").toLowerCase();
            return searchWords.every(word => fullName.includes(word) || email.includes(word));
          });
        }
        if (isMultiWordSearch) {
          const total = rawList.length;
          setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
          const pagedList = rawList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
          setUsers(pagedList.map(mapBackendToUser));
        } else {
          const pagination = response.pagination || (!Array.isArray(responseData) ? responseData.pagination : undefined);
          const totalRecords = pagination?.totalRecords ?? pagination?.total ?? rawList.length;
          setUsers(rawList.map(mapBackendToUser));
          setTotalPages(pagination?.totalPages ?? Math.max(1, Math.ceil(totalRecords / itemsPerPage)));
        }
        setHasLoadedOnce(true);
      } else {
        const errorText = response.message || "Failed to load users list.";
        setErrorMsg(errorText);
        toast.error(errorText);
      }
    } catch (error) {
      console.error(error);
      const errorText = getErrorMessage(error, "Failed to retrieve user list.");
      setErrorMsg(errorText);
      toast.error(errorText);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, itemsPerPage, sortConfig, statusFilter]);
  useEffect(() => {
    const requestKey = {
      resource: "users",
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch,
      status: statusFilter,
      sort: sortConfig
    };
    const timeoutId = window.setTimeout(() => {
      if (shouldFetch(requestKey)) {
        void loadUsers();
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [currentPage, debouncedSearch, itemsPerPage, loadUsers, shouldFetch, sortConfig, statusFilter]);
  const handleAddTrigger = () => {
    setSelectedUser(null);
    setView("add");
  };
  const handleEditTrigger = user => {
    setSelectedUser(user);
    setView("edit");
  };
  const handleDeleteTrigger = user => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      setSubmitting(true);
      setErrorMsg("");
      try {
        const response = await deleteTraineeUser(selectedUser.id);
        if (response.success) {
          const userName = `${selectedUser.firstName} ${selectedUser.lastName}`;
          setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
          toast.success(`User "${userName}" deleted successfully!`);
        } else {
          toast.error(response.message || "Failed to delete user.");
        }
      } catch (error) {
        console.error(error);
        toast.error(getErrorMessage(error, "An error occurred during deletion."));
      } finally {
        setSubmitting(false);
      }
    }
  };
  const handleFormSubmit = async userData => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      if (view === "add") {
        const dto = mapUserToCreateDto(userData);
        const response = await createTraineeUser(dto);
        if (response.success && response.data) {
          const createdUser = mapBackendToUser({
            ...response.data,
            password: response.data.password || userData.password
          });
          setUsers(prev => [createdUser, ...prev]);
          setView("list");
          setSelectedUser(null);
          toast.success(`User "${userData.firstName} ${userData.lastName}" created successfully!`);
        } else {
          toast.error(response.message || "Failed to create user.");
        }
      } else if (view === "edit" && selectedUser) {
        const dto = mapUserToUpdateDto(userData);
        const response = await updateTraineeUser(selectedUser.id, dto);
        if (response.success && response.data) {
          const updatedUser = mapBackendToUser({
            ...response.data,
            password: response.data.password || userData.password
          });
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
          setView("list");
          setSelectedUser(null);
          toast.success(`User "${userData.firstName} ${userData.lastName}" updated successfully!`);
        } else {
          toast.error(response.message || "Failed to update user.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "An error occurred while saving user details."));
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="mx-auto w-full space-y-5">
      {submitting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff5b21]" />
            <p className="text-xs text-gray-500 font-bold mt-2">Saving user details...</p>
          </div>
        </div>}

      {errorMsg && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2">
          <span>{errorMsg}</span>
        </div>}

      {view === "list" ? <UserListView users={users} isLoading={isLoading} search={search} statusFilter={statusFilter} currentPage={currentPage} itemsPerPage={itemsPerPage} totalPages={totalPages} onAddUser={handleAddTrigger} onEditUser={handleEditTrigger} onDeleteUser={handleDeleteTrigger} onSearchChange={setSearch} onStatusFilterChange={handleStatusFilterChange} onPageChange={setCurrentPage} sortConfig={sortConfig} onSort={handleSortChange} /> : <UserFormView mode={view} user={selectedUser} onBack={() => setView("list")} onSubmit={handleFormSubmit} />}

      {/* Delete User Modal overlay */}
      <DeleteUserModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} userName={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ""} />
    </div>;
}