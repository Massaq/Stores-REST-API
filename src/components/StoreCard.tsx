import React from "react";
import { Trash2, Plus } from "lucide-react";
import { Store } from "../api/types";

interface StoreCardProps {
  store: Store;
  onDelete: (name: string) => void;
  onAddItemToStore: (storeId: number) => void;
  isDeleting: boolean;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  onDelete,
  onAddItemToStore,
  isDeleting,
}) => {
  const totalValuation = store.items.reduce((acc, item) => acc + item.price, 0);

  return (
    <article className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>ID #{store.id}</span>
              <span aria-hidden="true">·</span>
              <span>{store.items.length} cataloged items</span>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {store.name}
            </h3>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(store.name)}
            aria-label={`Delete store ${store.name}`}
            className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          {store.items.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">
              No inventory items assigned to this store location yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {store.items.map((item) => (
                <li
                  key={item.id}
                  className="py-2.5 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {item.name}
                    </p>
                    {item.tags.length > 0 && (
                      <p className="text-xs text-slate-500 truncate">
                        {item.tags.map((t) => t.name).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-xs font-medium text-slate-900 whitespace-nowrap shrink-0">
                    ${item.price.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          <span>Valuation</span>
          <span aria-hidden="true"> · </span>
          <span className="font-mono font-semibold text-slate-900">
            ${totalValuation.toFixed(2)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddItemToStore(store.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item</span>
        </button>
      </div>
    </article>
  );
};
