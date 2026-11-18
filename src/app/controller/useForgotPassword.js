import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { forgotPasswordApi } from "../../api/post";

export default function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (response) => {
      if (response?.success) {
        toast.success(response.message || "Password reset link sent successfully!");
      } else {
        toast.error(response?.message || "Failed to send reset link.");
      }
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send reset link. Please try again.";
      toast.error(errorMessage);
    },
  });
}
