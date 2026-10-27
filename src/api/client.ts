import { ApiErrorBody } from "./types";

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "";

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload: unknown = isJson ? await response.json() : null;

  if (!response.ok) {
    const errBody = (payload || {}) as ApiErrorBody;
    const message =
      errBody.message ||
      errBody.description ||
      errBody.status ||
      `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status, errBody.error);
  }

  return payload as T;
}
