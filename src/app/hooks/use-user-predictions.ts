import { useQuery } from "@tanstack/react-query";
import { getUserPredictions } from "@/app/actions";

export const useUserPredictions = (userId: number) => {
  return useQuery({
    queryKey: ['userPredictions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const predictions = await getUserPredictions(userId);
      return predictions;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!userId,
  });
};