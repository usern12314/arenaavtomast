import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cx } from "../lib/utils";

type Kind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: Kind;
  text: string;
}

interface ToastApi {
  push(kind: Kind, text: string): void;
  success(text: string): void;
  error(text: string): void;
  info(text: string): void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
};

const ICONS: Record<Kind, React.ReactNode> = {
  success: <CheckCircle2 size={17} className="text-mint" />,
  error: <AlertTriangle size={17} className="text-danger" />,
  info: <Info size={17} className="text-sky2" />,
};

const BORDER: Record<Kind, string> = {
  success: "border-mint/40",
  error: "border-danger/40",
  info: "border-sky2/40",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: Kind, text: string) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-4), { id, kind, text }]);
      window.setTimeout(() => remove(id), 3800);
    },
    [remove]
  );

  const api: ToastApi = {
    push,
    success: (t) => push("success", t),
    error: (t) => push("error", t),
    info: (t) => push("info", t),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[90] flex w-[320px] max-w-[calc(100vw-40px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cx(
                "flex items-start gap-2.5 rounded-xl border bg-panel2/95 px-3.5 py-3 shadow-2xl shadow-black/50 backdrop-blur",
                BORDER[t.kind]
              )}
            >
              <span className="mt-0.5 shrink-0">{ICONS[t.kind]}</span>
              <p className="flex-1 text-[13px] leading-snug text-slate-200">
                {t.text}
              </p>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 rounded-md p-0.5 text-faint transition hover:bg-panel3 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
