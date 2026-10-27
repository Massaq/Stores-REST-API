import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteUserById, fetchUserById, fetchUsers } from "../api/users";
import { User } from "../api/types";

export const USERS_QUERY_KEY = ["users"] as const;

export function useUsersQuery() {
  return useQuery<User[], Error>({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
  });
}

export function useUserLookupMutation() {
  return useMutation({
    mutationFn: (userId: number) => fetchUserById(userId),
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => deleteUserById(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
