import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <h2
            id="modal-heading"
            className="text-base font-semibold text-slate-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
};
