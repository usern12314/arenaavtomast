import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  CarFront,
  Database,
  Download,
  History as HistoryIcon,
  LayoutDashboard,
  PackagePlus,
  ShoppingCart,
  Upload,
  Wrench,
} from "lucide-react";
import { StoreProvider, useStore } from "./store";
import { ToastProvider, useToast } from "./components/Toaster";
import { Badge, Button } from "./components/ui";
import DataModal from "./components/DataModal";
import Dashboard from "./views/Dashboard";
import Arrivals from "./views/Arrivals";
import Parts from "./views/Parts";
import Sales from "./views/Sales";
import Works from "./views/Works";
import Cars from "./views/Cars";
import History from "./views/History";
import type { ViewId } from "./lib/types";
import { cx, downloadFile, fmtMoney, todayHumanFull, todayISO } from "./lib/utils";

const NAV: { id: ViewId; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }[] = [
  { id: "dash", label: "Панель", icon: LayoutDashboard },
  { id: "arrivals", label: "Поступление", icon: PackagePlus },
  { id: "parts", label: "Запчасти", icon: Boxes },
  { id: "sales", label: "Продажи", icon: ShoppingCart },
  { id: "works", label: "Работы", icon: Wrench },
  { id: "cars", label: "Журнал авто", icon: CarFront },
  { id: "history", label: "История", icon: HistoryIcon },
];

const TITLES: Record<ViewId, { title: string; sub: string }> = {
  dash: { title: "Панель управления", sub: "Сводка дня" },
  arrivals: { title: "Поступление запчастей", sub: "Приём товара на склад" },
  parts: { title: "Запчасти", sub: "Склад и остатки" },
  sales: { title: "Продажи", sub: "Оформление и история продаж" },
  works: { title: "Работа с машинами", sub: "Журналы мастеров" },
  cars: { title: "Журнал авто", sub: "Работы и запчасти по каждому автомобилю" },
  history: { title: "История", sub: "Все операции за период" },
};

function Shell() {
  const [view, setView] = useState<ViewId>("dash");
  const { state, importData } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dataOpen, setDataOpen] = useState(false);

  const today = todayISO();
  const profitToday =
    state.sales.filter((s) => s.date === today).reduce((a, s) => a + s.profit, 0) +
    state.works.filter((w) => w.date === today).reduce((a, w) => a + w.cost, 0);

  const exportBackup = () => {
    downloadFile(
      `avtomasterskaya-backup-${todayISO()}.json`,
      JSON.stringify(state, null, 2)
    );
    toast.success("Резервная копия скачана в формате JSON");
  };

  const onImportFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const r = importData(parsed);
        if (r.ok) toast.success("Данные восстановлены из резервной копии");
        else toast.error(r.error ?? "Ошибка импорта");
      } catch {
        toast.error("Не удалось прочитать файл");
      }
    };
    reader.readAsText(f);
  };

  const go = (v: string) => setView(v as ViewId);

  return (
    <div className="noise min-h-screen bg-ink">
      {/* фоновые свечения */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand/[0.05] blur-[120px]" />
        <div className="absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-sky2/[0.04] blur-[120px]" />
      </div>

      {/* ── сайдбар (desktop) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-panel/80 backdrop-blur-lg lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8a2b] to-[#ef5f05] shadow-lg shadow-brand/30">
            <Wrench size={19} className="text-white" />
          </span>
          <div>
            <p className="font-display text-[15px] font-bold leading-tight tracking-tight text-white">
              Автомастерская
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
              учёт запчастей и работ
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((n) => {
            const active = view === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={cx(
                  "group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition-colors",
                  active ? "text-white" : "text-muted hover:bg-panel2 hover:text-slate-200"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-xl border border-brand/30 bg-gradient-to-r from-brand/20 to-brand/[0.06]"
                  />
                )}
                <n.icon
                  size={17}
                  className={cx("relative z-10 transition", active ? "text-brand2" : "text-faint group-hover:text-slate-300")}
                />
                <span className="relative z-10">{n.label}</span>
                {active && (
                  <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-brand2 shadow-[0_0_8px_rgba(255,158,74,0.9)]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-line p-3">
          <p className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">
            Резервные копии
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button size="sm" icon={Download} onClick={exportBackup}>
              Скачать
            </Button>
            <Button size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
              Загрузить
            </Button>
          </div>
          <Button size="sm" icon={Database} className="w-full" onClick={() => setDataOpen(true)}>
            Данные и импорт (.db)
          </Button>
          <p className="flex items-center gap-1.5 px-1 pt-1 text-[10px] text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Автосохранение в браузер включено
          </p>
        </div>
      </aside>

      {/* ── мобильная навигация ── */}
      <div className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-lg lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2.5">
          <span className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff8a2b] to-[#ef5f05]">
            <Wrench size={15} className="text-white" />
          </span>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cx(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition",
                view === n.id
                  ? "border-brand/50 bg-brand/15 text-white"
                  : "border-line bg-panel text-muted"
              )}
            >
              <n.icon size={13} />
              {n.label}
            </button>
          ))}
          <button
            onClick={exportBackup}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[12px] font-semibold text-muted"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* ── контент ── */}
      <main className="relative z-10 lg:ml-60">
        <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <AnimatePresence mode="wait">
                <motion.h1
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="font-display text-2xl font-bold tracking-tight text-white sm:text-[28px]"
                >
                  {TITLES[view].title}
                </motion.h1>
              </AnimatePresence>
              <p className="mt-0.5 text-[13px] text-faint">{TITLES[view].sub}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="gray" className="hidden sm:inline-flex">{todayHumanFull()}</Badge>
              <Badge tone="mint" className="tnum">Сегодня: {fmtMoney(profitToday)}</Badge>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {view === "dash" && <Dashboard go={go} />}
              {view === "arrivals" && <Arrivals />}
              {view === "parts" && <Parts />}
              {view === "sales" && <Sales />}
              {view === "works" && <Works />}
              {view === "cars" && <Cars />}
              {view === "history" && <History />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImportFile(f);
          e.target.value = "";
        }}
      />

      <DataModal open={dataOpen} onClose={() => setDataOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}
