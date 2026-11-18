import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { changePasswordApi } from "../../api/put";

export default function useChangePassword() {
  return useMutation({
    mutationFn: changePasswordApi,
    onSuccess: (response) => {
      if (response?.success) {
        toast.success(response.message || "Password changed successfully!");
      } else {
        toast.error(response?.message || "Failed to change password.");
      }
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to change password. Please try again.";
      toast.error(errorMessage);
    },
  });
}
