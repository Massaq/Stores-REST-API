import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppSection, Navbar } from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { ItemsPage } from "./pages/ItemsPage";
import { StoresPage } from "./pages/StoresPage";
import { TagsPage } from "./pages/TagsPage";
import { UsersPage } from "./pages/UsersPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const WorkspaceShell: React.FC = () => {
  const { isAuthenticated, username, isInitializing } = useAuth();
  const [activeSection, setActiveSection] = useState<AppSection>("stores");
  const [preselectedStoreId, setPreselectedStoreId] = useState<number | null>(
    null
  );
  const [isCreateModalRequested, setIsCreateModalRequested] =
    useState<boolean>(false);

  const handleNavigateToCreateItem = (storeId?: number) => {
    setPreselectedStoreId(storeId ?? null);
    setIsCreateModalRequested(true);
    setActiveSection("items");
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Initializing workspace session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isAuthenticated={isAuthenticated}
        username={username}
        onQuickCreateItem={() => handleNavigateToCreateItem()}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeSection === "stores" && (
          <StoresPage
            onNavigateToCreateItem={(storeId) =>
              handleNavigateToCreateItem(storeId)
            }
          />
        )}
        {activeSection === "items" && (
          <ItemsPage
            preselectedStoreId={preselectedStoreId}
            isCreateModalRequested={isCreateModalRequested}
            onClearCreateRequest={() => setIsCreateModalRequested(false)}
            onNavigateToAuth={() => setActiveSection("auth")}
          />
        )}
        {activeSection === "tags" && <TagsPage />}
        {activeSection === "users" && <UsersPage />}
        {activeSection === "auth" && <AuthPage />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>Stores REST API Management Console</span>
          <span>
            Signed in as:{" "}
            <strong className="font-mono text-slate-800">
              {isAuthenticated && username ? username : "Guest"}
            </strong>
          </span>
        </div>
      </footer>
    </div>
  );
};

export function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <WorkspaceShell />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
