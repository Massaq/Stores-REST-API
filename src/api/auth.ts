import { apiRequest } from "./client";
import {
  AuthTokens,
  CredentialsPayload,
  MessageResponse,
  RefreshTokenResponse,
} from "./types";

export function registerUser(
  payload: CredentialsPayload
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/register", {
    method: "POST",
    body: payload,
  });
}

export function loginUser(payload: CredentialsPayload): Promise<AuthTokens> {
  return apiRequest<AuthTokens>("/login", {
    method: "POST",
    body: payload,
  });
}

export function logoutUser(accessToken: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/logout", {
    method: "POST",
    token: accessToken,
  });
}

export function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  return apiRequest<RefreshTokenResponse>("/refresh", {
    method: "POST",
    token: refreshToken,
  });
}
