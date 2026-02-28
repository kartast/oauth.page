import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Check, X, Info } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  exiting?: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Start exit animation, then remove
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, 2800);
  }, []);

  const icon = (type: Toast["type"]) => {
    if (type === "success") return <Check size={14} className="shrink-0" />;
    if (type === "error") return <X size={14} className="shrink-0" />;
    return <Info size={14} className="shrink-0" />;
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[min(20rem,calc(100vw-2rem))]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${t.exiting ? "toast-exit" : "toast-enter"} flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg ${
              t.type === "success"
                ? "bg-emerald-950/95 text-emerald-300 border border-emerald-800/60"
                : t.type === "error"
                ? "bg-red-950/95 text-red-300 border border-red-800/60"
                : "bg-zinc-900/95 text-zinc-300 border border-zinc-700/60"
            }`}
          >
            {icon(t.type)}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
