import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/actions";

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const users = await getUsers();
      return users;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};