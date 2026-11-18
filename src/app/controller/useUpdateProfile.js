import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateUserApi } from "../../api/put";
import { updateUser } from "../store/slices/authSlices";

export default function useUpdateProfile() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: updateUserApi,
    onSuccess: (response) => {
      if (response?.success) {
        if (response.data) {
          dispatch(updateUser(response.data));
        }
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.success(response.message || "Profile updated successfully!");
      } else {
        toast.error(response?.message || "Failed to update profile.");
      }
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile. Please try again.";
      toast.error(errorMessage);
    },
  });
}
