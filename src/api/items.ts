import { apiRequest } from "./client";
import {
  CreateItemPayload,
  Item,
  MessageResponse,
  UpdateItemPayload,
} from "./types";

export function fetchItems(accessToken: string): Promise<Item[]> {
  return apiRequest<Item[]>("/item", {
    token: accessToken,
  });
}

export function fetchItemByName(
  name: string,
  accessToken: string
): Promise<Item> {
  return apiRequest<Item>(`/item/${encodeURIComponent(name)}`, {
    token: accessToken,
  });
}

export function createItem(
  payload: CreateItemPayload,
  accessToken: string
): Promise<Item> {
  return apiRequest<Item>(`/item/${encodeURIComponent(payload.name)}`, {
    method: "POST",
    token: accessToken,
    body: {
      price: payload.price,
      store_id: payload.store_id,
    },
  });
}

export function updateItem(payload: UpdateItemPayload): Promise<Item> {
  return apiRequest<Item>(`/item/${encodeURIComponent(payload.name)}`, {
    method: "PUT",
    body: {
      price: payload.price,
      ...(payload.store_id !== undefined ? { store_id: payload.store_id } : {}),
    },
  });
}

export function deleteItem(
  name: string,
  accessToken: string
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(`/item/${encodeURIComponent(name)}`, {
    method: "DELETE",
    token: accessToken,
  });
}
