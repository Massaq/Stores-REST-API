import React, { useState } from "react";
import { KeyRound, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export const AuthPage: React.FC = () => {
  const {
    isAuthenticated,
    username,
    userId,
    isAdmin,
    isFreshToken,
    accessToken,
    login,
    register,
    logout,
    refreshSession,
  } = useAuth();
  const { pushToast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [formUsername, setFormUsername] = useState<string>("");
  const [formPassword, setFormPassword] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUser = formUsername.trim();
    if (!trimmedUser || !formPassword) {
      setFormError("Both username and password are required.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login({ username: trimmedUser, password: formPassword });
        setFormPassword("");
        pushToast(`Signed in as "${trimmedUser}".`, "success");
      } else {
        await register({ username: trimmedUser, password: formPassword });
        await login({ username: trimmedUser, password: formPassword });
        setFormPassword("");
        pushToast(
          `Registered and signed in as "${trimmedUser}".`,
          "success"
        );
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Authentication failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (
    demoUser: string,
    demoPass: string
  ) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      await login({ username: demoUser, password: demoPass });
      pushToast(`Switched session to "${demoUser}".`, "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to switch session.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshSession();
      pushToast(
        "Issued non-fresh access token via POST /refresh.",
        "info"
      );
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Token refresh failed.",
        "error"
      );
    }
  };

  const handleLogout = async () => {
    await logout();
    pushToast("Access token added to blocklist and session cleared.", "info");
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500">
          Flask-JWT-Extended Lifecycle · Access, Refresh &amp; Redis Blocklist
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Session &amp; Token Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "login"
                ? "Sign In with Credentials"
                : "Register New Account"}
            </h2>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFormError(null);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setFormError(null);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Register
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-username"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-600 font-medium">{formError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Processing..."
                : mode === "login"
                ? "Obtain Fresh Access & Refresh Tokens"
                : "Register & Sign In"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Quick Preset Accounts
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("admin", "admin123")}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Sign in as Admin (ID #1 · Full Delete Rights)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("operator", "operator123")}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Sign in as Operator (ID #2 · Non-Admin)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-800" />
              <h2 className="text-base font-semibold text-slate-900">
                Active JWT Session State
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {isAuthenticated ? "Authenticated" : "Signed Out"}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div>
                  <dt className="text-slate-500">Active User</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {username} (ID #{userId})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Admin Claim</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-slate-900">
                    is_admin: {String(isAdmin)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Token Freshness</dt>
                  <dd className="mt-0.5 font-mono font-semibold text-slate-900">
                    fresh: {String(isFreshToken)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Token Preview</dt>
                  <dd className="mt-0.5 font-mono text-slate-600 truncate">
                    {accessToken?.slice(0, 22)}...
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Simulate Token Refresh (POST /refresh)</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Revoke &amp; Sign Out (POST /logout)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-2">
              <KeyRound className="w-5 h-5 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-800">
                No active JWT token in session
              </p>
              <p className="text-xs text-slate-500">
                Sign in on the left or choose a preset user to inspect token
                claims and access protected <code className="font-mono">/item</code>{" "}
                routes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
