import { useQuery } from "@tanstack/react-query";
import { getChamas } from "@/app/actions";

export const useChamas = () => {
  return useQuery({
    queryKey: ['chamas'],
    queryFn: async () => {
      const chamas = await getChamas();
      return chamas;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};