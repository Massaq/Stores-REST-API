import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createItem,
  deleteItem,
  fetchItems,
  updateItem,
} from "../api/items";
import {
  CreateItemPayload,
  Item,
  UpdateItemPayload,
} from "../api/types";
import { useAuth } from "./useAuth";
import { STORES_QUERY_KEY } from "./useStores";
import { TAGS_QUERY_KEY } from "./useTags";

export const ITEMS_QUERY_KEY = ["items"] as const;

export function useItemsQuery() {
  const { accessToken, isAuthenticated } = useAuth();
  return useQuery<Item[], Error>({
    queryKey: [...ITEMS_QUERY_KEY, accessToken],
    queryFn: () => fetchItems(accessToken || ""),
    enabled: isAuthenticated && Boolean(accessToken),
  });
}

export function useCreateItemMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateItemPayload) => {
      if (!accessToken) {
        throw new Error("Authentication required to create items.");
      }
      return createItem(payload, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateItemPayload) => updateItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    },
  });
}

export function useDeleteItemMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => {
      if (!accessToken) {
        throw new Error("Authentication required to delete items.");
      }
      return deleteItem(name, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    },
  });
}
