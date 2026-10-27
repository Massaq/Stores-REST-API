import React, { createContext, useCallback, useState } from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  tone: ToastTone;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  pushToast: (title: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (title: string, tone: ToastTone = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, tone }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4000);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, pushToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm shadow-sm transition-opacity duration-150 ${
              toast.tone === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : toast.tone === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <span className="font-medium">{toast.title}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-xs text-slate-500 hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
