import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getTraineesApi } from "../../api/get";
import { createTraineeApi, importTraineesApi } from "../../api/post";
import { updateTraineeApi, updateTraineeStatusApi } from "../../api/put";
import { deleteTraineeApi } from "../../api/delete";
import { toast } from "react-toastify";

export default function useTraineeManagementList(
  page = 1,
  limit = 10,
  search = "",
  startDate = "",
  endDate = "",
  filterStatus = "",
  sortBy = "",
  sortOrder = "",
) {
  return useQuery({
    queryKey: [
      "trainees",
      page,
      limit,
      search,
      startDate,
      endDate,
      filterStatus,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      page && params.append("page", page);
      limit && params.append("limit", limit);
      search && params.append("search", search);
      startDate && params.append("startDate", startDate);
      endDate && params.append("endDate", endDate);
      filterStatus && params.append("status", filterStatus);
      sortBy && params.append("sortBy", sortBy);
      sortOrder && params.append("sortOrder", sortOrder);

      const result = await getTraineesApi(params.toString());
      const trainees = Array.isArray(result?.data?.data)
        ? result.data.data
        : Array.isArray(result?.data)
        ? result.data
        : [];

      return {
        data: trainees.map((trainee) => ({
          id: trainee.id,
          key: trainee.id,
          name: `${trainee.first_name || ""} ${trainee.last_name || ""}`.trim(),
          firstName: trainee.first_name,
          lastName: trainee.last_name,
          email: trainee.email,
          phone: trainee.phone,
          status: trainee.status || "Enrolled",
          traineeCode: trainee.trainee_code || trainee.id,
          programId: trainee.program_id,
          programName: trainee.program?.name || trainee.program?.title || trainee.program_name || "",
          createDate: trainee.created_at
            ? new Date(trainee.created_at).toLocaleDateString()
            : "",
          originalData: trainee,
        })),
        pagination: {
          total: result?.pagination?.total || result?.pagination?.totalRecords || trainees.length,
          page: result?.pagination?.page || page,
          pageSize: result?.pagination?.limit || limit,
          totalPages: result?.pagination?.totalPages || 1,
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

export const useCreateTrainee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTraineeApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      toast.success(data?.message || "Trainee created successfully!");
    },
    onError: (error) => {
      if (Array.isArray(error?.message)) {
        error.message.forEach((msg) => toast.error(msg));
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create trainee. Please try again.");
      }
    },
  });
};

export const useUpdateTrainee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTraineeApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["trainee"] });
      toast.success(data?.message || "Trainee updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update trainee.");
    },
  });
};

export const useUpdateTraineeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTraineeStatusApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      toast.success(data?.message || "Trainee status updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update trainee status.");
    },
  });
};

export const useDeleteTrainee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTraineeApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      toast.success(data?.message || "Trainee deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Something went wrong. Please try again.");
    },
  });
};

export const useImportTrainees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importTraineesApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      toast.success(data?.message || "Trainees imported successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to import trainees.");
    },
  });
};
