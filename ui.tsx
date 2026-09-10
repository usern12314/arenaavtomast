import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, PackageOpen, Search, X } from "lucide-react";
import { cx } from "../lib/utils";
import { useToast } from "./Toaster";

/* ─────────────────────────── Button ─────────────────────────── */

type BtnVariant = "primary" | "ghost" | "danger" | "success" | "sky";

const BTN: Record<BtnVariant, string> = {
  primary:
    "bg-gradient-to-b from-[#ff8a2b] to-[#ef5f05] text-white shadow-lg shadow-brand/25 hover:brightness-110 border border-[#ff9a45]/40",
  ghost:
    "border border-line bg-panel2 text-slate-200 hover:bg-panel3 hover:border-line2",
  danger:
    "border border-danger/30 bg-danger/10 text-[#ff9a8a] hover:bg-danger/20 hover:border-danger/50",
  success:
    "border border-mint/30 bg-mint/10 text-mint hover:bg-mint/20 hover:border-mint/50",
  sky: "border border-sky2/30 bg-sky2/10 text-sky2 hover:bg-sky2/20 hover:border-sky2/50",
};

export function Button({
  variant = "ghost",
  size = "md",
  icon: Icon,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md";
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.965 }}
      className={cx(
        "inline-flex select-none items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        size === "md" ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
        BTN[variant],
        className
      )}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {Icon && <Icon size={size === "md" ? 16 : 14} />}
      {children}
    </motion.button>
  );
}

export function IconBtn({
  icon: Icon,
  title,
  tone = "ghost",
  onClick,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  tone?: "ghost" | "danger" | "orange";
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cx(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition",
        tone === "ghost" &&
          "border-transparent text-faint hover:border-line hover:bg-panel3 hover:text-slate-200",
        tone === "danger" &&
          "border-transparent text-faint hover:border-danger/40 hover:bg-danger/15 hover:text-danger",
        tone === "orange" &&
          "border-transparent text-faint hover:border-brand/40 hover:bg-brand/15 hover:text-brand2"
      )}
    >
      <Icon size={14} />
    </button>
  );
}

/* ─────────────────────────── Card ─────────────────────────── */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-line bg-panel shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_16px_40px_-24px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({
  icon: Icon,
  title,
  hint,
  actions,
  tone = "brand",
}: {
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  hint?: string;
  actions?: React.ReactNode;
  tone?: "brand" | "mint" | "sky";
}) {
  const toneCls =
    tone === "brand" ? "bg-brand/15 text-brand2" : tone === "mint" ? "bg-mint/15 text-mint" : "bg-sky2/15 text-sky2";
  return (
    <div className="flex items-center gap-3 border-b border-line px-5 py-4">
      {Icon && (
        <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg", toneCls)}>
          <Icon size={16} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-100">
          {title}
        </h3>
        {hint && <p className="mt-0.5 truncate text-xs text-faint">{hint}</p>}
      </div>
      {actions}
    </div>
  );
}

/* ─────────────────────────── Form controls ─────────────────────────── */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-line bg-panel2 px-3 py-2.5 text-sm text-slate-100 placeholder:text-faint transition focus:border-brand/60 focus:ring-[3px] focus:ring-brand/15 disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(inputBase, className)} {...rest} />;
});

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputBase, "cursor-pointer appearance-none", className)} {...rest}>
      {children}
    </select>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cx("relative", className)}>
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputBase, "pl-9")}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition hover:bg-panel3 hover:text-slate-300"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── Badge ─────────────────────────── */

type BadgeTone = "orange" | "sky" | "mint" | "red" | "gray" | "gold";

const BADGE: Record<BadgeTone, string> = {
  orange: "bg-brand/15 text-brand2 border-brand/30",
  sky: "bg-sky2/15 text-sky2 border-sky2/30",
  mint: "bg-mint/15 text-mint border-mint/30",
  red: "bg-danger/15 text-[#ff9a8a] border-danger/30",
  gray: "bg-panel3 text-muted border-line",
  gold: "bg-gold/15 text-gold border-gold/30",
};

export function Badge({
  tone = "gray",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[11px] font-semibold",
        BADGE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────── DataTable ─────────────────────────── */

export interface Col<T> {
  title: React.ReactNode;
  align?: "l" | "c" | "r";
  className?: string;
  render(row: T, index: number): React.ReactNode;
  raw?(row: T): string;
}

export function DataTable<T>({
  cols,
  rows,
  rowKey,
  dense = false,
  empty,
}: {
  cols: Col<T>[];
  rows: T[];
  rowKey(row: T): string;
  dense?: boolean;
  empty?: { title: string; hint?: string };
}) {
  const toast = useToast();
  const alignCls = (a?: "l" | "c" | "r") =>
    a === "c" ? "text-center" : a === "r" ? "text-right" : "text-left";

  const copyCell = (text: string) => {
    if (text === "") return;
    const done = () => toast.info(`Скопировано: ${text.split("\t").slice(0, 3).join(" · ")}`);
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done, () => toast.error("Не удалось скопировать"));
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        done();
      }
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-panel2/70">
            {cols.map((c, i) => (
              <th
                key={i}
                className={cx(
                  "whitespace-nowrap px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted",
                  alignCls(c.align),
                  c.className
                )}
              >
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length}>
                <EmptyState
                  title={empty?.title ?? "Нет данных"}
                  hint={empty?.hint}
                />
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              className={cx(
                "group border-b border-line/60 transition-colors last:border-0 hover:bg-brand/[0.045]",
                i % 2 === 1 && "bg-white/[0.015]"
              )}
            >
              {cols.map((c, j) => (
                <td
                  key={j}
                  title={c.raw ? "Двойной клик — скопировать ячейку" : undefined}
                  onDoubleClick={
                    c.raw
                      ? (event) => {
                          event.stopPropagation();
                          copyCell(c.raw!(row));
                        }
                      : undefined
                  }
                  className={cx(
                    "px-4 align-middle",
                    dense ? "py-2" : "py-2.5",
                    c.raw && "cursor-copy select-text",
                    alignCls(c.align),
                    c.className
                  )}
                >
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <PackageOpen size={28} className="text-line2" />
      <p className="text-sm font-semibold text-muted">{title}</p>
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

/* ─────────────────────────── Modal ─────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide = false,
  noPad = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
  noPad?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cx(
              "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-line2 bg-panel shadow-2xl shadow-black/60",
              wide ? "max-w-5xl" : "max-w-lg"
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h3 className="font-display text-[15px] font-semibold tracking-tight text-slate-100">
                  {title}
                </h3>
                {subtitle && (
                  <p className="mt-0.5 truncate text-xs text-faint">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-faint transition hover:bg-panel3 hover:text-slate-200"
              >
                <X size={17} />
              </button>
            </div>
            <div className={cx("overflow-y-auto", !noPad && "p-5")}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Удалить",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-danger/30 bg-danger/12 text-danger">
          <AlertTriangle size={18} />
        </span>
        <p className="pt-1.5 text-sm leading-relaxed text-slate-300">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ─────────────────────────── Segmented tabs ─────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-panel2 p-1",
        className
      )}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cx(
              "relative rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              active ? "text-white" : "text-muted hover:text-slate-200"
            )}
          >
            {active && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-gradient-to-b from-[#ff8a2b] to-[#ef5f05] shadow-md shadow-brand/30"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
