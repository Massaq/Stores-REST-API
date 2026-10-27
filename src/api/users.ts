import { apiRequest } from "./client";
import { MessageResponse, User } from "./types";

export function fetchUsers(): Promise<User[]> {
  return apiRequest<User[]>("/user");
}

export function fetchUserById(userId: number): Promise<User> {
  return apiRequest<User>(`/user/${userId}`);
}

export function deleteUserById(userId: number): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(`/user/${userId}`, {
    method: "DELETE",
  });
}
