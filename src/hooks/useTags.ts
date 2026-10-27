import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTagByName,
  fetchTags,
  linkTagToItem,
  unlinkOrDeleteTag,
} from "../api/tags";
import { LinkTagPayload, Tag, UnlinkTagPayload } from "../api/types";
import { ITEMS_QUERY_KEY } from "./useItems";
import { STORES_QUERY_KEY } from "./useStores";

export const TAGS_QUERY_KEY = ["tags"] as const;

export function useTagsQuery() {
  return useQuery<Tag[], Error>({
    queryKey: TAGS_QUERY_KEY,
    queryFn: fetchTags,
  });
}

export function useTagLookupMutation() {
  return useMutation({
    mutationFn: (name: string) => fetchTagByName(name),
  });
}

export function useLinkTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LinkTagPayload) => linkTagToItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
  });
}

export function useUnlinkOrDeleteTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UnlinkTagPayload) => unlinkOrDeleteTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
  });
}
