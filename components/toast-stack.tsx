"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

export type ToastTone = "success" | "error" | "loading";

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  timeoutMs?: number;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const DEFAULT_TIMEOUT_MS = 4200;

const toastStyles: Record<
  ToastTone,
  { shell: string; icon: string; progress: string; closeButton: string }
> = {
  success: {
    shell: "border-emerald-200 bg-white/95 text-slate-900",
    icon: "text-emerald-600",
    progress: "bg-emerald-500/80",
    closeButton: "text-slate-400 transition hover:text-emerald-700",
  },
  error: {
    shell: "border-rose-200 bg-white/95 text-slate-900",
    icon: "text-rose-600",
    progress: "bg-rose-500/80",
    closeButton: "text-slate-400 transition hover:text-rose-700",
  },
  loading: {
    shell: "border-brand/10 bg-gradient-to-r from-brand to-brand-dark text-white",
    icon: "text-accent",
    progress: "bg-accent/80",
    closeButton: "text-white/70 transition hover:text-white",
  },
};

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") {
    return <CheckCircle2 className="h-5 w-5" />;
  }

  if (tone === "error") {
    return <AlertCircle className="h-5 w-5" />;
  }

  return <LoaderCircle className="h-5 w-5 animate-spin" />;
}

export function useToastQueue() {
  const nextId = useRef(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function dismissToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function pushToast(toast: Omit<ToastItem, "id">) {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { id, ...toast }]);
    return id;
  }

  function patchToast(id: number, patch: Partial<Omit<ToastItem, "id">>) {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, ...patch } : toast)),
    );
  }

  return {
    toasts,
    dismissToast,
    pushToast,
    patchToast,
  };
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  useEffect(() => {
    const timers = toasts
      .filter((toast) => toast.tone !== "loading")
      .map((toast) =>
        window.setTimeout(() => onDismiss(toast.id), toast.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onDismiss, toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
    >
      {toasts.map((toast) => {
        const toneStyle = toastStyles[toast.tone];
        const timeoutMs = toast.timeoutMs ?? DEFAULT_TIMEOUT_MS;

        return (
          <div
            key={toast.id}
            className={`toast-shell pointer-events-auto relative overflow-hidden rounded-2xl border px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur ${toneStyle.shell}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${toneStyle.icon}`}>
                <ToastIcon tone={toast.tone} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{toast.title}</div>
                {toast.description ? (
                  <p
                    className={`mt-1 text-sm ${toast.tone === "loading" ? "text-white/80" : "text-slate-500"}`}
                  >
                    {toast.description}
                  </p>
                ) : null}
              </div>
              {toast.tone !== "loading" ? (
                <button
                  type="button"
                  className={toneStyle.closeButton}
                  onClick={() => onDismiss(toast.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {toast.tone !== "loading" ? (
              <div
                className={`toast-progress absolute inset-x-0 bottom-0 h-1 origin-left ${toneStyle.progress}`}
                style={{ "--toast-duration": `${timeoutMs}ms` } as CSSProperties}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
