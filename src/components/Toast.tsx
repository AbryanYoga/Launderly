"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastMessage {
  type: "success" | "error" | "info" | "warning";
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export function Toast({ toast, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";
  const isWarning = toast.type === "warning";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-4 right-4 z-50 flex max-w-sm sm:max-w-md items-center gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 no-print bg-white ${
        isSuccess
          ? "border-success/30 text-dark shadow-success/10"
          : isError
          ? "border-danger/30 text-dark shadow-danger/10"
          : isWarning
          ? "border-warning/30 text-dark shadow-warning/10"
          : "border-primary/30 text-dark shadow-primary/10"
      }`}
    >
      <div className="shrink-0">
        {isSuccess && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
        {isError && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        {isWarning && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        {!isSuccess && !isError && !isWarning && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Info className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex-1 pr-2">
        <p className="text-xs font-semibold leading-relaxed text-dark break-words">
          {toast.text}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 text-gray-400 hover:text-dark hover:bg-gray-100 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
