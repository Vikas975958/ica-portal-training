import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getProgramsApi, getProgramTagsApi } from "../../api/get";
import { createProgramApi } from "../../api/post";
import { updateProgramApi, toggleProgramStatusApi } from "../../api/put";
import { deleteProgramApi } from "../../api/delete";
import { mapProgramToItem } from "../../utils/program/program.utils";
import { toast } from "react-toastify";

export default function useProgramManagementList(
  page = 1,
  limit = 10,
  search = "",
  status = "",
  tag = "",
  sortBy = "created_at",
  sortOrder = "desc",
) {
  return useQuery({
    queryKey: [
      "programs",
      page,
      limit,
      search,
      status,
      tag,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder: sortOrder.toUpperCase(),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(tag ? { tag } : {}),
      };

      const result = await getProgramsApi(params);
      let programs = [];
      let pagination = result?.pagination;

      if (result?.success && result?.data) {
        if (Array.isArray(result.data)) {
          programs = result.data;
        } else if (typeof result.data === "object" && Array.isArray(result.data.programs)) {
          programs = result.data.programs;
          pagination = { ...pagination, ...result.data.pagination };
        }
      }

      const total =
        pagination?.totalRecords ??
        pagination?.total ??
        programs.length;
      const totalPages =
        pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));

      return {
        data: programs.map(mapProgramToItem),
        pagination: {
          total,
          page: pagination?.page || page,
          pageSize: pagination?.limit || limit,
          totalPages,
        },
      };
    },
    placeholderData: sortBy && sortOrder ? keepPreviousData : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: 3,
    enabled: !!page,
  });
}

export const useProgramTags = () => {
  return useQuery({
    queryKey: ["program-tags"],
    queryFn: async () => {
      const result = await getProgramTagsApi();
      return result?.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProgramApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program-tags"] });
      toast.success(data?.message || "Program created successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create program.");
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProgramApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program-tags"] });
      toast.success(data?.message || "Program updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update program.");
    },
  });
};

export const useToggleProgramStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleProgramStatusApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success(data?.message || "Program status updated!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update status.");
    },
  });
};

export const useDeleteProgram = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteProgramApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success(data?.message || "Program deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete program.");
    },
  });
};
