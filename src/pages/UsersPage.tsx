import React, { useState } from "react";
import { Search, Trash2, UserPlus } from "lucide-react";
import { registerUser } from "../api/auth";
import { User } from "../api/types";
import {
  USERS_QUERY_KEY,
  useDeleteUserMutation,
  useUserLookupMutation,
  useUsersQuery,
} from "../hooks/useUsers";
import { useToast } from "../hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";

export const UsersPage: React.FC = () => {
  const { data: users = [], isLoading } = useUsersQuery();
  const deleteUserMutation = useDeleteUserMutation();
  const lookupUserMutation = useUserLookupMutation();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const [lookupIdInput, setLookupIdInput] = useState<string>("");
  const [lookedUpUser, setLookedUpUser] = useState<User | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedId = Number(lookupIdInput);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setLookupError("Enter a valid numeric user ID.");
      setLookedUpUser(null);
      return;
    }
    setLookupError(null);
    try {
      const result = await lookupUserMutation.mutateAsync(parsedId);
      setLookedUpUser(result);
    } catch (err) {
      setLookedUpUser(null);
      setLookupError(err instanceof Error ? err.message : "User not found.");
    }
  };

  const handleCreateAccount = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const trimmedUsername = newUsername.trim();
    if (!trimmedUsername || !newPassword) {
      pushToast("Provide both username and password.", "error");
      return;
    }
    setIsCreating(true);
    try {
      await registerUser({
        username: trimmedUsername,
        password: newPassword,
      });
      setNewUsername("");
      setNewPassword("");
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      pushToast(
        `User "${trimmedUsername}" registered and welcome task queued.`,
        "success"
      );
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Registration failed.",
        "error"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      if (lookedUpUser?.id === userId) {
        setLookedUpUser(null);
      }
      pushToast(`Deleted user "${username}" (#${userId}).`, "info");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to delete user.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-500">
          Identity &amp; Access Directory · User Endpoints
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Registered Users
        </h1>
        <p className="mt-2 text-xs text-slate-600">
          Inspect user accounts by ID (<code className="font-mono">GET /user/&lt;int:user_id&gt;</code>),
          provision new users (<code className="font-mono">POST /register</code>), or remove accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Lookup User by ID
            </h2>
            <form onSubmit={handleLookup} className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <label htmlFor="user-id-lookup" className="sr-only">
                  User ID
                </label>
                <input
                  id="user-id-lookup"
                  type="number"
                  min={1}
                  value={lookupIdInput}
                  onChange={(e) => setLookupIdInput(e.target.value)}
                  placeholder="Enter numeric User ID (e.g. 1)..."
                  className="w-full pl-9 pr-4 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <button
                type="submit"
                disabled={lookupUserMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
              >
                Fetch User
              </button>
            </form>

            {lookupError && (
              <p className="mt-3 text-xs text-red-600 font-medium">
                {lookupError}
              </p>
            )}

            {lookedUpUser && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-slate-500">
                    ID #{lookedUpUser.id} ·{" "}
                    {lookedUpUser.id === 1
                      ? "Admin Claim (is_admin: true)"
                      : "Standard Claim"}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {lookedUpUser.username}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteUser(lookedUpUser.id, lookedUpUser.username)
                  }
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Delete Account
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Active Accounts
              </h2>
              <span className="text-xs font-mono text-slate-500">
                {users.length} accounts
              </span>
            </div>
            {isLoading ? (
              <div className="p-6 space-y-3 animate-pulse">
                <div className="h-8 bg-slate-100 rounded" />
                <div className="h-8 bg-slate-100 rounded" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="px-6 py-3">User ID</th>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">JWT Privilege Level</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                        #{user.id}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        {user.id === 1
                          ? "Administrator (is_admin = true)"
                          : "Operator (is_admin = false)"}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteUser(user.id, user.username)
                          }
                          aria-label={`Delete user ${user.username}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">
              Register User Account
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Calls <code className="font-mono">POST /register</code> and
            dispatches the Celery welcome email background task.
          </p>

          <form onSubmit={handleCreateAccount} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="reg-username"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g.warehouse_lead"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCreating ? "Registering..." : "Register Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
