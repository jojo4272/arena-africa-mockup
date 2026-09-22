import { useQuery } from "@tanstack/react-query";
import { getUserTransactions } from "@/app/actions";

export const useUserTransactions = (userId: number) => {
  return useQuery({
    queryKey: ['userTransactions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const transactions = await getUserTransactions(userId);
      return transactions;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!userId,
  });
};