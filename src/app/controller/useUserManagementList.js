import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getUsersApi } from "../../api/get";
import { createUserApi } from "../../api/post";
import { updateUserApi } from "../../api/put";
import { deleteUserApi } from "../../api/delete";
import { toast } from "react-toastify";

export default function useUserManagementList(
  page = 1,
  limit = 10,
  search = "",
) {
  return useQuery({
    queryKey: ["users", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      page && params.append("page", page);
      limit && params.append("limit", limit);
      search && params.append("search", search);

      const result = await getUsersApi(params.toString());
      const users = Array.isArray(result?.data?.data)
        ? result.data.data
        : Array.isArray(result?.data)
        ? result.data
        : [];

      return {
        data: users.map((user) => ({
          id: user.id,
          key: user.id,
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          status: user.status || "active",
          perm_dashboard: Boolean(user.perm_dashboard),
          perm_trainees: Boolean(user.perm_trainees),
          perm_transaction: Boolean(user.perm_transaction),
          perm_program: Boolean(user.perm_program),
          perm_user: Boolean(user.perm_user),
          originalData: user,
        })),
        pagination: {
          total: result?.pagination?.total || result?.pagination?.totalRecords || users.length,
          page: result?.pagination?.page || page,
          pageSize: result?.pagination?.limit || limit,
          totalPages: result?.pagination?.totalPages || 1,
        },
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: 3,
    enabled: !!page,
  });
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(data?.message || "User created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create user.");
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(data?.message || "User updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update user.");
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteUserApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(data?.message || "User deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Something went wrong. Please try again.");
    },
  });
};
