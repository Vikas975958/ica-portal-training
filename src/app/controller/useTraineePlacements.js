import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlacementsByTraineeApi } from "../../api/get";
import { createPlacementApi } from "../../api/post";
import { updatePlacementApi } from "../../api/put";
import { deletePlacementApi } from "../../api/delete";
import { toast } from "react-toastify";

export default function useTraineePlacements(traineeId) {
  return useQuery({
    queryKey: ["trainee-placements", traineeId],
    queryFn: async () => {
      if (!traineeId) return [];
      const result = await getPlacementsByTraineeApi(traineeId);
      return result?.data || [];
    },
    enabled: Boolean(traineeId),
    staleTime: 1000 * 60 * 3,
  });
}

export const useCreatePlacement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlacementApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-placements"] });
      toast.success(data?.message || "Placement record added successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add placement record.");
    },
  });
};

export const useUpdatePlacement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlacementApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-placements"] });
      toast.success(data?.message || "Placement record updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update placement record.");
    },
  });
};

export const useDeletePlacement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deletePlacementApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-placements"] });
      toast.success(data?.message || "Placement record deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete placement record.");
    },
  });
};
