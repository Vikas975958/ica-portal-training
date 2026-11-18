import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotesByTraineeApi } from "../../api/get";
import { createNoteApi } from "../../api/post";
import { updateNoteApi } from "../../api/put";
import { deleteNoteApi } from "../../api/delete";
import { toast } from "react-toastify";

export default function useTraineeNotes(traineeId) {
  return useQuery({
    queryKey: ["trainee-notes", traineeId],
    queryFn: async () => {
      if (!traineeId) return [];
      const result = await getNotesByTraineeApi(traineeId);
      return result?.data || [];
    },
    enabled: Boolean(traineeId),
    staleTime: 1000 * 60 * 3,
  });
}

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNoteApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-notes"] });
      toast.success(data?.message || "Note added successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to add note.");
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNoteApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-notes"] });
      toast.success(data?.message || "Note updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update note.");
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteNoteApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trainee-notes"] });
      toast.success(data?.message || "Note deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete note.");
    },
  });
};
