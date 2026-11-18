import { useQuery } from "@tanstack/react-query";
import { getProgramsApi, getProgramTagsApi } from "../../api/get";

export default function useGetDropdown(type = "programs") {
  return useQuery({
    queryKey: ["dropdown", type],
    queryFn: async () => {
      if (type === "programs") {
        const result = await getProgramsApi({ page: 1, limit: 100 });
        let programs = [];
        if (result?.success && result?.data) {
          if (Array.isArray(result.data)) {
            programs = result.data;
          } else if (typeof result.data === "object" && Array.isArray(result.data.programs)) {
            programs = result.data.programs;
          }
        }
        return programs.map((p) => ({
          label: p.name || p.title,
          value: p.id,
          original: p,
        }));
      }

      if (type === "tags") {
        const result = await getProgramTagsApi();
        return (result?.data || []).map((t) => ({
          label: t,
          value: t,
        }));
      }

      return [];
    },
    staleTime: 1000 * 60 * 10,
  });
}
