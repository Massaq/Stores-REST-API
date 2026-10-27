import { apiRequest } from "./client";
import { MessageResponse, Store } from "./types";

export function fetchStores(): Promise<Store[]> {
  return apiRequest<Store[]>("/store");
}

export function fetchStoreByName(name: string): Promise<Store> {
  return apiRequest<Store>(`/store/${encodeURIComponent(name)}`);
}

export function createStore(name: string): Promise<Store> {
  return apiRequest<Store>(`/store/${encodeURIComponent(name)}`, {
    method: "POST",
  });
}

export function deleteStore(name: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(`/store/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}
