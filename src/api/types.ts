export interface StoreSummary {
  id: number;
  name: string;
}

export interface TagSummary {
  id: number;
  name: string;
}

export interface ItemWithoutStore {
  id: number;
  name: string;
  price: number;
  tags: TagSummary[];
}

export interface ItemWithoutTags {
  id: number;
  name: string;
  price: number;
  store: StoreSummary;
}

export interface Item {
  id: number;
  name: string;
  price: number;
  store: StoreSummary;
  tags: TagSummary[];
}

export interface Store {
  id: number;
  name: string;
  items: ItemWithoutStore[];
}

export interface Tag {
  id: number;
  name: string;
  items: ItemWithoutTags[];
}

export interface User {
  id: number;
  username: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface MessageResponse {
  message: string;
}

export interface TagAndItemResponse {
  message: string;
  item: Item;
  tag: Tag;
}

export interface CreateItemPayload {
  name: string;
  price: number;
  store_id: number;
}

export interface UpdateItemPayload {
  name: string;
  price: number;
  store_id?: number;
}

export interface LinkTagPayload {
  tagName: string;
  item_id: number;
}

export interface UnlinkTagPayload {
  tagName: string;
  item_id?: number;
}

export interface CredentialsPayload {
  username: string;
  password: string;
}

export interface ApiErrorBody {
  code?: number;
  status?: string;
  message?: string;
  description?: string;
  error?: string;
}
