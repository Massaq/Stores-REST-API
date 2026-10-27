import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Item } from "../api/types";
import { ItemRow } from "../components/ItemRow";
import { Modal } from "../components/Modal";
import { useAuth } from "../hooks/useAuth";
import {
  useCreateItemMutation,
  useDeleteItemMutation,
  useItemsQuery,
  useUpdateItemMutation,
} from "../hooks/useItems";
import { useStoresQuery } from "../hooks/useStores";
import {
  useLinkTagMutation,
  useTagsQuery,
  useUnlinkOrDeleteTagMutation,
} from "../hooks/useTags";
import { useToast } from "../hooks/useToast";

interface ItemsPageProps {
  preselectedStoreId: number | null;
  isCreateModalRequested: boolean;
  onClearCreateRequest: () => void;
  onNavigateToAuth: () => void;
}

export const ItemsPage: React.FC<ItemsPageProps> = ({
  preselectedStoreId,
  isCreateModalRequested,
  onClearCreateRequest,
  onNavigateToAuth,
}) => {
  const { isAuthenticated, isAdmin, isFreshToken } = useAuth();
  const { data: items = [], isLoading, isError, error } = useItemsQuery();
  const { data: stores = [] } = useStoresQuery();
  const { data: tags = [] } = useTagsQuery();

  const createItemMutation = useCreateItemMutation();
  const updateItemMutation = useUpdateItemMutation();
  const deleteItemMutation = useDeleteItemMutation();
  const linkTagMutation = useLinkTagMutation();
  const unlinkTagMutation = useUnlinkOrDeleteTagMutation();
  const { pushToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("all");

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createName, setCreateName] = useState<string>("");
  const [createPrice, setCreatePrice] = useState<string>("");
  const [createStoreId, setCreateStoreId] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editStoreId, setEditStoreId] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  const [tagTargetItem, setTagTargetItem] = useState<Item | null>(null);
  const [newTagName, setNewTagName] = useState<string>("");

  useEffect(() => {
    if (isCreateModalRequested) {
      setIsCreateOpen(true);
      if (preselectedStoreId) {
        setCreateStoreId(String(preselectedStoreId));
      } else if (stores.length > 0 && !createStoreId) {
        setCreateStoreId(String(stores[0].id));
      }
      onClearCreateRequest();
    }
  }, [
    isCreateModalRequested,
    preselectedStoreId,
    stores,
    createStoreId,
    onClearCreateRequest,
  ]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStore =
        selectedStoreFilter === "all" ||
        String(item.store.id) === selectedStoreFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.store.name.toLowerCase().includes(q) ||
        item.tags.some((t) => t.name.toLowerCase().includes(q));
      return matchesStore && matchesQuery;
    });
  }, [items, selectedStoreFilter, searchQuery]);

  const openCreateModal = () => {
    setCreateError(null);
    setCreateName("");
    setCreatePrice("");
    setCreateStoreId(
      preselectedStoreId
        ? String(preselectedStoreId)
        : stores[0]
        ? String(stores[0].id)
        : ""
    );
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const trimmedName = createName.trim();
    const parsedPrice = Number(createPrice);
    const parsedStoreId = Number(createStoreId);

    if (!trimmedName) {
      setCreateError("Item name is required.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setCreateError("Enter a valid positive price.");
      return;
    }
    if (!Number.isInteger(parsedStoreId) || parsedStoreId <= 0) {
      setCreateError("Select a destination store.");
      return;
    }

    setCreateError(null);
    try {
      await createItemMutation.mutateAsync({
        name: trimmedName,
        price: parsedPrice,
        store_id: parsedStoreId,
      });
      setIsCreateOpen(false);
      pushToast(`Item "${trimmedName}" created.`, "success");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create item."
      );
    }
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditPrice(String(item.price));
    setEditStoreId(String(item.store.id));
    setEditError(null);
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) {
      return;
    }
    const parsedPrice = Number(editPrice);
    const parsedStoreId = Number(editStoreId);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setEditError("Enter a valid positive price.");
      return;
    }

    try {
      await updateItemMutation.mutateAsync({
        name: editingItem.name,
        price: parsedPrice,
        store_id: Number.isInteger(parsedStoreId) ? parsedStoreId : undefined,
      });
      pushToast(`Updated "${editingItem.name}".`, "success");
      setEditingItem(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update item."
      );
    }
  };

  const handleDeleteItem = async (name: string) => {
    try {
      await deleteItemMutation.mutateAsync(name);
      pushToast(`Item "${name}" deleted.`, "info");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to delete item.",
        "error"
      );
    }
  };

  const handleAttachTag = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tagTargetItem) {
      return;
    }
    const trimmed = newTagName.trim();
    if (!trimmed) {
      return;
    }
    try {
      await linkTagMutation.mutateAsync({
        tagName: trimmed,
        item_id: tagTargetItem.id,
      });
      setNewTagName("");
      pushToast(
        `Linked tag "${trimmed}" to "${tagTargetItem.name}".`,
        "success"
      );
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to attach tag.",
        "error"
      );
    }
  };

  const handleDetachTag = async (tagName: string) => {
    if (!tagTargetItem) {
      return;
    }
    try {
      await unlinkTagMutation.mutateAsync({
        tagName,
        item_id: tagTargetItem.id,
      });
      pushToast(
        `Removed tag "${tagName}" from "${tagTargetItem.name}".`,
        "info"
      );
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to remove tag.",
        "error"
      );
    }
  };

  const liveTagTargetItem = useMemo(() => {
    if (!tagTargetItem) {
      return null;
    }
    return items.find((i) => i.id === tagTargetItem.id) || tagTargetItem;
  }, [items, tagTargetItem]);

  if (!isAuthenticated) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-lg mx-auto my-8">
        <h1 className="text-xl font-bold text-slate-900">
          JWT Authentication Required
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The <code className="font-mono text-xs">/item</code> endpoints require
          a valid Bearer access token. Sign in to view, create, or update
          inventory items.
        </p>
        <button
          type="button"
          onClick={onNavigateToAuth}
          className="mt-5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Catalog Inventory · JWT Protected Endpoint
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Inventory Items
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono">
            <span>{items.length} stocked items</span>
            <span aria-hidden="true">·</span>
            <span>
              Token status: {isFreshToken ? "Fresh JWT" : "Non-fresh JWT"}
            </span>
            <span aria-hidden="true">·</span>
            <span>Role: {isAdmin ? "Admin (ID #1)" : "Standard User"}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Item</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <label htmlFor="item-search" className="sr-only">
            Search items
          </label>
          <input
            id="item-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item name, store, or tag..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedStoreFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedStoreFilter === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Stores ({items.length})
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => setSelectedStoreFilter(String(store.id))}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedStoreFilter === String(store.id)
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {store.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-10 bg-slate-100 rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-900">
          <p className="font-semibold">Error loading items</p>
          <p className="mt-1 text-red-700">
            {error instanceof Error ? error.message : "Request failed"}
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h2 className="text-base font-semibold text-slate-900">
            No items match the current filter
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a new item or adjust your store and keyword filters.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Store Location</th>
                  <th className="px-4 py-3">Associated Tags</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onEdit={openEditModal}
                    onManageTags={(target) => setTagTargetItem(target)}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        title="Create New Inventory Item"
        onClose={() => setIsCreateOpen(false)}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {!isFreshToken && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              POST <code className="font-mono">/item/&lt;name&gt;</code>{" "}
              requires a <strong>fresh</strong> access token. If your token was
              obtained via <code className="font-mono">/refresh</code>, re-login
              first.
            </div>
          )}
          <div>
            <label
              htmlFor="create-item-name"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Item Name
            </label>
            <input
              id="create-item-name"
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Studio Monitor Arm"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label
              htmlFor="create-item-price"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Price (USD)
            </label>
            <input
              id="create-item-price"
              type="number"
              step="0.01"
              value={createPrice}
              onChange={(e) => setCreatePrice(e.target.value)}
              placeholder="199.99"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label
              htmlFor="create-item-store"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Store Location
            </label>
            <select
              id="create-item-store"
              value={createStoreId}
              onChange={(e) => setCreateStoreId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Select store...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (ID #{s.id})
                </option>
              ))}
            </select>
          </div>
          {createError && (
            <p className="text-xs text-red-600 font-medium">{createError}</p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createItemMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              {createItemMutation.isPending ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editingItem)}
        title={`Update Item: ${editingItem?.name || ""}`}
        onClose={() => setEditingItem(null)}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-item-price"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Updated Price (USD)
            </label>
            <input
              id="edit-item-price"
              type="number"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label
              htmlFor="edit-item-store"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Store Location
            </label>
            <select
              id="edit-item-store"
              value={editStoreId}
              onChange={(e) => setEditStoreId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (ID #{s.id})
                </option>
              ))}
            </select>
          </div>
          {editError && (
            <p className="text-xs text-red-600 font-medium">{editError}</p>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateItemMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
            >
              {updateItemMutation.isPending ? "Updating..." : "Update Price"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(liveTagTargetItem)}
        title={`Tags for "${liveTagTargetItem?.name || ""}"`}
        onClose={() => setTagTargetItem(null)}
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Attached Tags
            </p>
            {liveTagTargetItem && liveTagTargetItem.tags.length === 0 ? (
              <p className="text-xs text-slate-500">
                No tags currently linked to this item.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {liveTagTargetItem?.tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800">
                      {tag.name}{" "}
                      <span className="text-slate-400 font-mono">
                        (#{tag.id})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDetachTag(tag.name)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Unlink
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAttachTag} className="space-y-3">
            <label
              htmlFor="attach-tag-input"
              className="block text-xs font-semibold text-slate-700"
            >
              Attach Existing or New Tag
            </label>
            <div className="flex gap-2">
              <input
                id="attach-tag-input"
                type="text"
                list="existing-tags-datalist"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <datalist id="existing-tags-datalist">
                {tags.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
              <button
                type="submit"
                disabled={linkTagMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
              >
                Attach Tag
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
