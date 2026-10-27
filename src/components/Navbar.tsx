import React from "react";

export type AppSection = "stores" | "items" | "tags" | "users" | "auth";

interface NavbarProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  isAuthenticated: boolean;
  username: string | null;
  onQuickCreateItem: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onSelectSection,
  isAuthenticated,
  onQuickCreateItem,
}) => {
  const navItems: Array<{ key: AppSection; label: string }> = [
    { key: "stores", label: "Stores" },
    { key: "items", label: "Items" },
    { key: "tags", label: "Tags" },
    { key: "users", label: "Users" },
    { key: "auth", label: isAuthenticated ? "Session" : "Sign In" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        <button
          type="button"
          onClick={() => onSelectSection("stores")}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left"
        >
          Stores Inventory API
        </button>

        <nav
          aria-label="Primary"
          className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectSection(item.key)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? "border-slate-900 text-slate-900 font-semibold"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onQuickCreateItem}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            New Item
          </button>
        </div>
      </div>
    </header>
  );
};
