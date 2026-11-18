import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectsByTraineeApi } from "../../api/get";
import { createProjectApi } from "../../api/post";
import { updateProjectApi } from "../../api/put";
import { deleteProjectApi } from "../../api/delete";
import { toast } from "react-toastify";

export default function useTraineeProjects(traineeId) {
  return useQuery({
    queryKey: ["trainee-projects", traineeId],
    queryFn: async () => {
      if (!traineeId) return [];
      const result = await getProjectsByTraineeApi(traineeId);
      return result?.data || [];
    },
    enabled: Boolean(traineeId),
    staleTime: 1000 * 60 * 3,
  });
}

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProjectApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-projects"] });
      toast.success(data?.message || "Project submitted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to submit project.");
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProjectApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-projects"] });
      toast.success(data?.message || "Project updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update project.");
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteProjectApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-projects"] });
      toast.success(data?.message || "Project deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete project.");
    },
  });
};
