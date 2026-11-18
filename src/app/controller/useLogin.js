import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { loginApi } from "../../api/post";
import { setCredentials } from "../store/slices/authSlices";
import { getFirstAllowedRoute } from "../../lib/permissions";

export default function useLogin() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (response) => {
      if (response.success && response.data?.access_token) {
        const token = response.data.access_token;
        const user = response.data.user;

        dispatch(setCredentials({ user, token }));

        // Dispatch login event for listeners
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth_login"));
        }

        const userName = user?.first_name
          ? `${user.first_name} ${user.last_name || ""}`.trim()
          : "Admin";
        toast.success(`Welcome back, ${userName}!`);

        const nextRoute = getFirstAllowedRoute(user) || "/dashboard";
        router.push(nextRoute);
      } else {
        const errorMsg =
          response.message || "Invalid credentials. Please try again.";
        toast.error(errorMsg);
      }
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to connect to the authentication server.";
      toast.error(errorMessage);
    },
  });
}
