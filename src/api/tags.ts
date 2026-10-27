import { apiRequest } from "./client";
import {
  LinkTagPayload,
  MessageResponse,
  Tag,
  TagAndItemResponse,
  UnlinkTagPayload,
} from "./types";

export function fetchTags(): Promise<Tag[]> {
  return apiRequest<Tag[]>("/tag");
}

export function fetchTagByName(name: string): Promise<Tag> {
  return apiRequest<Tag>(`/tag/${encodeURIComponent(name)}`);
}

export function linkTagToItem(payload: LinkTagPayload): Promise<Tag> {
  return apiRequest<Tag>(`/tag/${encodeURIComponent(payload.tagName)}`, {
    method: "POST",
    body: { item_id: payload.item_id },
  });
}

export function unlinkOrDeleteTag(
  payload: UnlinkTagPayload
): Promise<TagAndItemResponse | MessageResponse> {
  return apiRequest<TagAndItemResponse | MessageResponse>(
    `/tag/${encodeURIComponent(payload.tagName)}`,
    {
      method: "DELETE",
      body:
        payload.item_id !== undefined ? { item_id: payload.item_id } : undefined,
    }
  );
}
