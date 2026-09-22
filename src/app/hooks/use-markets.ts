import { useQuery } from "@tanstack/react-query";
import { getMarkets } from "@/actions";

export const useMarkets = () => {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const markets = await getMarkets();
      return markets;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};