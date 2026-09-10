import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Filter, History as HistoryIcon, RotateCcw, ShoppingCart, Wrench } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toaster";
import {
  Badge,
  Button,
  Card,
  CardHead,
  Col,
  DataTable,
  Field,
  Input,
  Select,
} from "../components/ui";
import { downloadFile, fmtDate, fmtMoney, fmtNum, isISO, toCSV, todayISO } from "../lib/utils";

interface Op {
  key: string;
  date: string;
  ts: number;
  kind: "sale" | "work";
  master: string;
  desc: string;
  sum: number;
  profit: number | null;
}

export default function History() {
  const { state } = useStore();
  const toast = useToast();

  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const today = todayISO();

  const todayStats = useMemo(() => {
    const sales = state.sales.filter((s) => s.date === today);
    const sp = sales.reduce((a, s) => a + s.profit, 0);
    const ss = sales.reduce((a, s) => a + s.total, 0);
    const byWorker = state.workers.map((w) => ({
      name: w.name,
      sum: state.works.filter((x) => x.workerId === w.id && x.date === today).reduce((a, x) => a + x.cost, 0),
    }));
    const wt = byWorker.reduce((a, x) => a + x.sum, 0);
    return { ss, sp, byWorker, wt };
  }, [state, today]);

  const ops = useMemo<Op[]>(() => {
    const out: Op[] = [];
    const inRange = (d: string) =>
      (!from || !isISO(from) || d >= from) && (!to || !isISO(to) || d <= to);

    if (type === "all" || type === "sales") {
      state.sales.forEach((s) => {
        if (!inRange(s.date)) return;
        out.push({
          key: `s${s.id}`,
          date: s.date,
          ts: s.ts,
          kind: "sale",
          master: "—",
          desc: `${s.partName}, ${s.quantity} шт. по ${fmtNum(s.sellPrice)} ₽`,
          sum: s.total,
          profit: s.profit,
        });
      });
    }
    const showWorks = type === "all" || type === "works" || type.startsWith("worker:");
    if (showWorks) {
      state.works.forEach((w) => {
        if (!inRange(w.date)) return;
        const worker = state.workers.find((x) => x.id === w.workerId);
        if (type.startsWith("worker:") && w.workerId !== type.slice(7)) return;
        out.push({
          key: `w${w.id}`,
          date: w.date,
          ts: w.ts,
          kind: "work",
          master: worker?.name ?? "—",
          desc: `${w.car} — ${w.work}`,
          sum: w.cost,
          profit: null,
        });
      });
    }
    return out.sort((a, b) => (a.date === b.date ? b.ts - a.ts : b.date.localeCompare(a.date)));
  }, [state, type, from, to]);

  const sums = useMemo(
    () => ({
      sales: ops.filter((o) => o.kind === "sale").reduce((a, o) => a + o.sum, 0),
      profit: ops.reduce((a, o) => a + (o.profit ?? 0), 0),
      works: ops.filter((o) => o.kind === "work").reduce((a, o) => a + o.sum, 0),
    }),
    [ops]
  );

  const exportCSV = () => {
    const header = ["Дата", "Тип", "Мастер", "Описание", "Сумма", "Прибыль"];
    const body = ops.map((o) => [
      fmtDate(o.date),
      o.kind === "sale" ? "Продажа" : "Работа",
      o.master,
      o.desc,
      fmtNum(o.sum),
      o.profit === null ? "" : fmtNum(o.profit),
    ]);
    downloadFile(
      `istoriya_${todayISO()}.csv`,
      "﻿" + toCSV([header, ...body]),
      "text/csv"
    );
    toast.success(`Экспортировано ${ops.length} записей в CSV`);
  };

  const cols: Col<Op>[] = [
    { title: "Дата", render: (r) => <span className="tnum text-muted">{fmtDate(r.date)}</span>, raw: (r) => fmtDate(r.date) },
    {
      title: "Тип",
      align: "c",
      render: (r) =>
        r.kind === "sale" ? (
          <Badge tone="orange">
            <ShoppingCart size={11} /> Продажа
          </Badge>
        ) : (
          <Badge tone="sky">
            <Wrench size={11} /> Работа
          </Badge>
        ),
      raw: (r) => (r.kind === "sale" ? "Продажа" : "Работа"),
    },
    { title: "Мастер", align: "c", render: (r) => <span className="text-muted">{r.master}</span>, raw: (r) => r.master },
    { title: "Описание", render: (r) => <span className="text-slate-200">{r.desc}</span>, raw: (r) => r.desc },
    { title: "Сумма", align: "r", render: (r) => <span className="tnum font-semibold">{fmtNum(r.sum)}</span>, raw: (r) => fmtNum(r.sum) },
    {
      title: "Прибыль",
      align: "r",
      render: (r) => (r.profit === null ? <span className="text-faint">—</span> : <span className="tnum font-semibold text-mint">+{fmtNum(r.profit)}</span>),
      raw: (r) => (r.profit === null ? "" : fmtNum(r.profit)),
    },
  ];

  return (
    <div className="space-y-5">
      {/* итоги дня */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardHead icon={HistoryIcon} title="Итоги за сегодня" hint={fmtDate(today)} />
          <div className="grid grid-cols-2 gap-3 p-5 xl:grid-cols-4">
            <DayCell l="Выручка с продаж" v={fmtMoney(todayStats.ss)} tone="text-brand2" />
            <DayCell l="Прибыль с продаж" v={fmtMoney(todayStats.sp)} tone="text-mint" />
            <DayCell
              l="Работы"
              v={fmtMoney(todayStats.wt)}
              tone="text-sky2"
              sub={todayStats.byWorker.map((x) => `${x.name}: ${fmtNum(x.sum)}`).join(" · ") || "—"}
            />
            <DayCell l="Общий итог" v={fmtMoney(todayStats.sp + todayStats.wt)} tone="text-white" strong />
          </div>
        </Card>
      </motion.div>

      {/* фильтр */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
        <Card>
          <div className="flex flex-wrap items-end gap-3 p-5">
            <Field label="Тип операций" className="w-full sm:w-56">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">Все операции</option>
                <option value="sales">Только продажи</option>
                <option value="works">Все работы</option>
                {state.workers.map((w) => (
                  <option key={w.id} value={`worker:${w.id}`}>
                    Работы — {w.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="С даты">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="По дату">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <Button
              icon={RotateCcw}
              onClick={() => {
                setType("all");
                setFrom("");
                setTo("");
              }}
            >
              Сбросить
            </Button>
            <div className="ml-auto">
              <Button variant="sky" icon={Download} onClick={exportCSV} disabled={ops.length === 0}>
                Скачать CSV
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* таблица */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
        <Card>
          <CardHead
            icon={Filter}
            tone="sky"
            title="История операций"
            hint={`${ops.length} записей · двойной клик по ячейке — скопировать значение`}
            actions={
              <div className="hidden flex-wrap gap-2 md:flex">
                <Badge tone="orange">Продажи: {fmtMoney(sums.sales)}</Badge>
                <Badge tone="mint">Прибыль: {fmtMoney(sums.profit)}</Badge>
                <Badge tone="sky">Работы: {fmtMoney(sums.works)}</Badge>
              </div>
            }
          />
          <DataTable
            cols={cols}
            rows={ops}
            rowKey={(r) => r.key}
            empty={{ title: "По фильтру ничего не найдено", hint: "Измените период или тип операций" }}
          />
        </Card>
      </motion.div>
    </div>
  );
}

function DayCell({ l, v, tone, sub, strong }: { l: string; v: string; tone: string; sub?: string; strong?: boolean }) {
  return (
    <div
      className={
        "rounded-xl border p-3.5 " +
        (strong ? "border-mint/30 bg-mint/[0.07]" : "border-line bg-panel2/60")
      }
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">{l}</p>
      <p className={`tnum mt-0.5 truncate font-display font-bold ${strong ? "text-xl" : "text-base"} ${tone}`}>{v}</p>
      {sub && <p className="mt-0.5 truncate text-[10px] text-faint">{sub}</p>}
    </div>
  );
}
