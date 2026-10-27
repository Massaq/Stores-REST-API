import React from "react";
import { Edit2, Tag as TagIcon, Trash2 } from "lucide-react";
import { Item } from "../api/types";

interface ItemRowProps {
  item: Item;
  isAdmin: boolean;
  onEdit: (item: Item) => void;
  onManageTags: (item: Item) => void;
  onDelete: (name: string) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  isAdmin,
  onEdit,
  onManageTags,
  onDelete,
}) => {
  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
        #{item.id}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        {item.name}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        <span>{item.store.name}</span>
        <span className="text-xs text-slate-400 font-mono">
          {" "}
          (ID #{item.store.id})
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {item.tags.length === 0 ? (
          <span className="text-slate-400">Untagged</span>
        ) : (
          <span>{item.tags.map((t) => t.name).join(" · ")}</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm font-medium text-slate-900 whitespace-nowrap">
        ${item.price.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onManageTags(item)}
            aria-label={`Manage tags for ${item.name}`}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors inline-flex items-center gap-1"
          >
            <TagIcon className="w-3.5 h-3.5" />
            <span>Tags</span>
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit price for ${item.name}`}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors inline-flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            disabled={!isAdmin}
            title={
              isAdmin
                ? `Delete ${item.name}`
                : "Admin privileges (user ID 1) required to delete items"
            }
            onClick={() => onDelete(item.name)}
            aria-label={`Delete item ${item.name}`}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
