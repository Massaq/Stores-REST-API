import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useItemsQuery } from "../hooks/useItems";
import {
  useLinkTagMutation,
  useTagsQuery,
  useUnlinkOrDeleteTagMutation,
} from "../hooks/useTags";
import { useToast } from "../hooks/useToast";

export const TagsPage: React.FC = () => {
  const { data: tags = [], isLoading } = useTagsQuery();
  const { data: items = [] } = useItemsQuery();
  const linkTagMutation = useLinkTagMutation();
  const unlinkOrDeleteMutation = useUnlinkOrDeleteTagMutation();
  const { pushToast } = useToast();

  const [tagNameInput, setTagNameInput] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleLinkTag = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTag = tagNameInput.trim();
    const parsedItemId = Number(selectedItemId);

    if (!trimmedTag) {
      setFormError("Tag name is required.");
      return;
    }
    if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) {
      setFormError("Select an item to associate with the tag.");
      return;
    }

    setFormError(null);
    try {
      await linkTagMutation.mutateAsync({
        tagName: trimmedTag,
        item_id: parsedItemId,
      });
      setTagNameInput("");
      pushToast(`Tag "${trimmedTag}" linked to item #${parsedItemId}.`, "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to link tag.",
        "error"
      );
    }
  };

  const handleUnlinkItem = async (tagName: string, itemId: number) => {
    try {
      await unlinkOrDeleteMutation.mutateAsync({
        tagName,
        item_id: itemId,
      });
      pushToast(`Unlinked item #${itemId} from tag "${tagName}".`, "info");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Failed to unlink item.",
        "error"
      );
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    try {
      await unlinkOrDeleteMutation.mutateAsync({
        tagName,
      });
      pushToast(`Tag "${tagName}" deleted.`, "info");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Cannot delete tag with items.",
        "error"
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Many-to-Many Taxonomy · Tag &amp; Item Associations
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Catalog Tags
          </h1>
          <p className="mt-2 text-xs text-slate-600">
            Create or attach tags to inventory items via{" "}
            <code className="font-mono">POST /tag/&lt;name&gt;</code>. Tags can
            only be deleted once all items are unlinked.
          </p>
        </div>

        <form
          onSubmit={handleLinkTag}
          className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5"
        >
          <div>
            <label htmlFor="tag-name-field" className="sr-only">
              Tag Name
            </label>
            <input
              id="tag-name-field"
              type="text"
              value={tagNameInput}
              onChange={(e) => {
                setTagNameInput(e.target.value);
                if (formError) {
                  setFormError(null);
                }
              }}
              placeholder="Tag name (e.g. Ergonomics)"
              className="w-full sm:w-52 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label htmlFor="tag-item-select" className="sr-only">
              Target Item
            </label>
            <select
              id="tag-item-select"
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                if (formError) {
                  setFormError(null);
                }
              }}
              className="w-full sm:w-56 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Select item to tag...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} · {item.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={linkTagMutation.isPending}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Attach Tag</span>
          </button>
        </form>
      </div>

      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
          {formError}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-44 bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
            />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h2 className="text-base font-semibold text-slate-900">
            No tags defined
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Use the form above to create a tag and link it to an item.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tags.map((tag) => {
            const canDelete = tag.items.length === 0;
            return (
              <article
                key={tag.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-500 font-mono">
                        <span>Tag ID #{tag.id}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{tag.items.length} linked items</span>
                      </div>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">
                        {tag.name}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.name)}
                      aria-label={`Delete tag ${tag.name}`}
                      title={
                        canDelete
                          ? `Delete tag ${tag.name}`
                          : "Unlink all items before deleting this tag"
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        canDelete
                          ? "text-red-700 bg-red-50 hover:bg-red-100"
                          : "text-slate-400 bg-slate-100 hover:text-slate-600"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Tag</span>
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {tag.items.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">
                        No items linked. This tag can now be deleted cleanly.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {tag.items.map((item) => (
                          <li
                            key={item.id}
                            className="py-2 flex items-center justify-between gap-4 text-sm"
                          >
                            <div className="min-w-0">
                              <span className="font-medium text-slate-900">
                                {item.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {" "}
                                · {item.store.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono text-xs text-slate-700">
                                ${item.price.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUnlinkItem(tag.name, item.id)
                                }
                                className="text-xs font-medium text-red-600 hover:text-red-800"
                              >
                                Unlink
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
