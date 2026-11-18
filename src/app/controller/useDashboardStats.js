import { useQuery } from "@tanstack/react-query";
import { getTraineesApi, getProgramsApi, getUsersApi, getFeeLedgersApi } from "../../api/get";

export default function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [traineesRes, programsRes, usersRes, feeRes] = await Promise.allSettled([
        getTraineesApi({ page: 1, limit: 1 }),
        getProgramsApi({ page: 1, limit: 1 }),
        getUsersApi({ page: 1, limit: 1 }),
        getFeeLedgersApi({ page: 1, limit: 1 }),
      ]);

      const totalTrainees =
        traineesRes.status === "fulfilled"
          ? traineesRes.value?.pagination?.totalRecords || traineesRes.value?.pagination?.total || 0
          : 0;

      const totalPrograms =
        programsRes.status === "fulfilled"
          ? programsRes.value?.pagination?.totalRecords || programsRes.value?.pagination?.total || 0
          : 0;

      const totalUsers =
        usersRes.status === "fulfilled"
          ? usersRes.value?.pagination?.totalRecords || usersRes.value?.pagination?.total || 0
          : 0;

      const totalTransactions =
        feeRes.status === "fulfilled"
          ? feeRes.value?.pagination?.totalRecords || feeRes.value?.pagination?.total || 0
          : 0;

      return {
        totalTrainees,
        totalPrograms,
        totalUsers,
        totalTransactions,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
