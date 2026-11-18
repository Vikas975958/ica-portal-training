import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { resetPasswordApi } from "../../api/post";

export default function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: (response) => {
      if (response?.success) {
        toast.success(response.message || "Password reset successfully!");
        router.push("/");
      } else {
        toast.error(response?.message || "Failed to reset password.");
      }
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    },
  });
}
