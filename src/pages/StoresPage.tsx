import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { StoreCard } from "../components/StoreCard";
import {
  useCreateStoreMutation,
  useDeleteStoreMutation,
  useStoresQuery,
} from "../hooks/useStores";
import { useToast } from "../hooks/useToast";

interface StoresPageProps {
  onNavigateToCreateItem: (storeId: number) => void;
}

export const StoresPage: React.FC<StoresPageProps> = ({
  onNavigateToCreateItem,
}) => {
  const { data: stores = [], isLoading, isError, error } = useStoresQuery();
  const createStoreMutation = useCreateStoreMutation();
  const deleteStoreMutation = useDeleteStoreMutation();
  const { pushToast } = useToast();

  const [storeNameInput, setStoreNameInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return stores;
    }
    return stores.filter(
      (store) =>
        store.name.toLowerCase().includes(query) ||
        store.items.some((item) => item.name.toLowerCase().includes(query))
    );
  }, [stores, searchQuery]);

  const totalCatalogItems = useMemo(
    () => stores.reduce((sum, store) => sum + store.items.length, 0),
    [stores]
  );

  const totalCatalogValuation = useMemo(
    () =>
      stores.reduce(
        (sum, store) =>
          sum + store.items.reduce((itemSum, item) => itemSum + item.price, 0),
        0
      ),
    [stores]
  );

  const handleCreateStore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = storeNameInput.trim();
    if (!trimmed) {
      setFormError("Store name is required.");
      return;
    }
    if (trimmed.length > 80) {
      setFormError("Store name must be 80 characters or fewer.");
      return;
    }
    setFormError(null);
    try {
      await createStoreMutation.mutateAsync(trimmed);
      setStoreNameInput("");
      pushToast(`Store "${trimmed}" created.`, "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to create store.",
        "error"
      );
    }
  };

  const handleDeleteStore = async (name: string) => {
    try {
      await deleteStoreMutation.mutateAsync(name);
      pushToast(`Store "${name}" deleted.`, "info");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to delete store.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Store Directory · Multi-Location Catalog
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Store Locations
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono">
            <span>{stores.length} active stores</span>
            <span aria-hidden="true">·</span>
            <span>{totalCatalogItems} total items</span>
            <span aria-hidden="true">·</span>
            <span>${totalCatalogValuation.toFixed(2)} aggregate valuation</span>
          </div>
        </div>

        <form
          onSubmit={handleCreateStore}
          className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5 w-full lg:w-auto"
        >
          <div className="flex flex-col">
            <label htmlFor="new-store-name" className="sr-only">
              New store name
            </label>
            <input
              id="new-store-name"
              type="text"
              value={storeNameInput}
              onChange={(e) => {
                setStoreNameInput(e.target.value);
                if (formError) {
                  setFormError(null);
                }
              }}
              placeholder="New store name (e.g. Berlin Flagship)"
              className="w-full sm:w-72 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {formError && (
              <span className="mt-1 text-xs text-red-600">{formError}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={createStoreMutation.isPending}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>
              {createStoreMutation.isPending ? "Creating..." : "Create Store"}
            </span>
          </button>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <label htmlFor="store-search" className="sr-only">
            Filter stores by name or item
          </label>
          <input
            id="store-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter stores by location or stocked item..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Showing {filteredStores.length} of {stores.length} stores
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 bg-white border border-slate-200 rounded-xl p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-5 w-48 bg-slate-200 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-900">
          <p className="font-semibold">Unable to load stores</p>
          <p className="mt-1 text-red-700">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h2 className="text-base font-semibold text-slate-900">
            No matching stores found
          </h2>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Create a new store location above or clear your search filter to
            view all stocked locations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onDelete={handleDeleteStore}
              onAddItemToStore={onNavigateToCreateItem}
              isDeleting={deleteStoreMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
};
