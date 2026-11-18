import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { uploadFileToS3 } from "@/utils/uploadFileToS3";

export default function useUploadMedia() {
  return useMutation({
    mutationFn: async ({ file, folder = "trainees" }) => {
      return await uploadFileToS3(file, folder);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to upload file.");
    },
  });
}
