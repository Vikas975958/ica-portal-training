import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getFeeLedgersApi, getTransactionsByTraineeApi } from "../../api/get";
import { createTransactionApi, importTransactionsApi } from "../../api/post";
import { updateTransactionApi } from "../../api/put";
import { deleteTransactionApi } from "../../api/delete";
import { toast } from "react-toastify";

export default function useTransactionsList(params = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  return useQuery({
    queryKey: ["transactions", page, limit, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      page && queryParams.append("page", page);
      limit && queryParams.append("limit", limit);
      search && queryParams.append("search", search);

      const result = await getFeeLedgersApi(queryParams.toString());
      const ledgers = Array.isArray(result?.data?.data)
        ? result.data.data
        : Array.isArray(result?.data)
        ? result.data
        : [];

      return {
        data: ledgers,
        pagination: {
          total: result?.pagination?.total || result?.pagination?.totalRecords || ledgers.length,
          page: result?.pagination?.page || page,
          pageSize: result?.pagination?.limit || limit,
          totalPages: result?.pagination?.totalPages || 1,
        },
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}

export const useTraineeTransactions = (traineeId) => {
  return useQuery({
    queryKey: ["trainee-transactions", traineeId],
    queryFn: async () => {
      if (!traineeId) return null;
      const result = await getTransactionsByTraineeApi(traineeId);
      return result?.data || null;
    },
    enabled: Boolean(traineeId),
    staleTime: 1000 * 60 * 3,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransactionApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      toast.success(data?.message || "Transaction recorded successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to record transaction.");
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTransactionApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-transactions"] });
      toast.success(data?.message || "Transaction updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update transaction.");
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTransactionApi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-transactions"] });
      toast.success(data?.message || "Transaction deleted successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to delete transaction.");
    },
  });
};

export const useImportTransactions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importTransactionsApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["trainee-transactions"] });
      toast.success(data?.message || "Transactions imported successfully!");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to import transactions.");
    },
  });
};
