import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStore,
  deleteStore,
  fetchStoreByName,
  fetchStores,
} from "../api/stores";
import { Store } from "../api/types";

export const STORES_QUERY_KEY = ["stores"] as const;

export function useStoresQuery() {
  return useQuery<Store[], Error>({
    queryKey: STORES_QUERY_KEY,
    queryFn: fetchStores,
  });
}

export function useStoreDetailQuery(name: string | null) {
  return useQuery<Store, Error>({
    queryKey: [...STORES_QUERY_KEY, name],
    queryFn: () => fetchStoreByName(name || ""),
    enabled: Boolean(name),
  });
}

export function useCreateStoreMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createStore(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
  });
}

export function useDeleteStoreMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteStore(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
