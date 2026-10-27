import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../api/auth";
import { CredentialsPayload } from "../api/types";

interface DecodedTokenClaims {
  sub?: string;
  fresh?: boolean;
  is_admin?: boolean;
}

function decodeTokenClaims(token: string | null): DecodedTokenClaims {
  if (!token) {
    return {};
  }
  const parts = token.split(".");
  try {
    const base64Payload = parts.length === 3 ? parts[1] : parts[0];
    const normalized = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = window.atob(normalized);
    return JSON.parse(json) as DecodedTokenClaims;
  } catch {
    return {};
  }
}

export interface AuthContextValue {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  userId: number | null;
  isAdmin: boolean;
  isFreshToken: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: CredentialsPayload) => Promise<void>;
  register: (payload: CredentialsPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const STORAGE_ACCESS_KEY = "stores_api_access_token";
const STORAGE_REFRESH_KEY = "stores_api_refresh_token";
const STORAGE_USERNAME_KEY = "stores_api_username";
const STORAGE_BOOTSTRAPPED_KEY = "stores_api_bootstrapped";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    window.localStorage.getItem(STORAGE_ACCESS_KEY)
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    window.localStorage.getItem(STORAGE_REFRESH_KEY)
  );
  const [username, setUsername] = useState<string | null>(() =>
    window.localStorage.getItem(STORAGE_USERNAME_KEY)
  );
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const persistTokens = useCallback(
    (
      nextAccess: string | null,
      nextRefresh: string | null,
      nextUsername: string | null
    ) => {
      setAccessToken(nextAccess);
      setRefreshToken(nextRefresh);
      setUsername(nextUsername);

      if (nextAccess) {
        window.localStorage.setItem(STORAGE_ACCESS_KEY, nextAccess);
      } else {
        window.localStorage.removeItem(STORAGE_ACCESS_KEY);
      }

      if (nextRefresh) {
        window.localStorage.setItem(STORAGE_REFRESH_KEY, nextRefresh);
      } else {
        window.localStorage.removeItem(STORAGE_REFRESH_KEY);
      }

      if (nextUsername) {
        window.localStorage.setItem(STORAGE_USERNAME_KEY, nextUsername);
      } else {
        window.localStorage.removeItem(STORAGE_USERNAME_KEY);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    const bootstrapDemoSession = async () => {
      const existingToken = window.localStorage.getItem(STORAGE_ACCESS_KEY);
      const alreadyBootstrapped = window.localStorage.getItem(
        STORAGE_BOOTSTRAPPED_KEY
      );
      if (!existingToken && !alreadyBootstrapped) {
        try {
          const tokens = await loginUser({
            username: "admin",
            password: "admin123",
          });
          if (active) {
            window.localStorage.setItem(STORAGE_BOOTSTRAPPED_KEY, "true");
            persistTokens(tokens.access_token, tokens.refresh_token, "admin");
          }
        } catch {
          window.localStorage.setItem(STORAGE_BOOTSTRAPPED_KEY, "true");
        }
      }
      if (active) {
        setIsInitializing(false);
      }
    };
    bootstrapDemoSession();
    return () => {
      active = false;
    };
  }, [persistTokens]);

  const login = useCallback(
    async (payload: CredentialsPayload) => {
      const tokens = await loginUser(payload);
      window.localStorage.setItem(STORAGE_BOOTSTRAPPED_KEY, "true");
      persistTokens(
        tokens.access_token,
        tokens.refresh_token,
        payload.username.trim()
      );
    },
    [persistTokens]
  );

  const register = useCallback(async (payload: CredentialsPayload) => {
    await registerUser(payload);
  }, []);

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await logoutUser(accessToken);
      } catch {
        persistTokens(null, null, null);
        return;
      }
    }
    persistTokens(null, null, null);
  }, [accessToken, persistTokens]);

  const refreshSession = useCallback(async () => {
    if (!refreshToken) {
      throw new Error("No refresh token available.");
    }
    const response = await refreshAccessToken(refreshToken);
    persistTokens(response.access_token, refreshToken, username);
  }, [refreshToken, username, persistTokens]);

  const claims = useMemo(() => decodeTokenClaims(accessToken), [accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      username,
      userId: claims.sub ? Number(claims.sub) : null,
      isAdmin: Boolean(claims.is_admin),
      isFreshToken: Boolean(claims.fresh),
      isAuthenticated: Boolean(accessToken),
      isInitializing,
      login,
      register,
      logout,
      refreshSession,
    }),
    [
      accessToken,
      refreshToken,
      username,
      claims,
      isInitializing,
      login,
      register,
      logout,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
