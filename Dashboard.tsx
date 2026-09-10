import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Box,
  Boxes,
  CalendarDays,
  Car,
  ChevronRight,
  CircleDollarSign,
  PackagePlus,
  ShoppingCart,
  Trophy,
  Wrench,
} from "lucide-react";
import { useStore } from "../store";
import { Card, CardHead, Badge } from "../components/ui";
import {
  daysAgoISO,
  fmtDate,
  fmtDateShort,
  fmtInt,
  fmtMoney,
  monthStartISO,
  todayHumanFull,
  todayISO,
} from "../lib/utils";

/* ────────────── helpers ────────────── */

function useCountUp(target: number, dur = 900) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to = target;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setV(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else {
        setV(to);
        prev.current = to;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return v;
}

interface DayPoint {
  date: string;
  sales: number;
  works: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

/* ────────────── Dashboard ────────────── */

export default function Dashboard({ go }: { go: (v: string) => void }) {
  const { state, firmName } = useStore();

  const today = todayISO();
  const monthStart = monthStartISO();

  const m = useMemo(() => {
    const salesToday = state.sales.filter((s) => s.date === today);
    const profitToday = salesToday.reduce((a, s) => a + s.profit, 0);
    const totalToday = salesToday.reduce((a, s) => a + s.total, 0);
    const worksToday = state.works.filter((w) => w.date === today);
    const worksSumToday = worksToday.reduce((a, w) => a + w.cost, 0);

    const profitMonth = state.sales
      .filter((s) => s.date >= monthStart)
      .reduce((a, s) => a + s.profit, 0);
    const worksMonth = state.works
      .filter((w) => w.date >= monthStart)
      .reduce((a, w) => a + w.cost, 0);

    const stockCost = state.parts.reduce((a, p) => a + p.quantity * p.buyPrice, 0);
    const stockMargin = state.parts.reduce(
      (a, p) => a + p.quantity * (p.sellPrice - p.buyPrice),
      0
    );

    const lowStock = state.parts
      .filter((p) => p.quantity <= 3)
      .sort((a, b) => a.quantity - b.quantity);

    const series: DayPoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = daysAgoISO(i);
      series.push({
        date: d,
        sales: state.sales.filter((s) => s.date === d).reduce((a, s) => a + s.profit, 0),
        works: state.works.filter((w) => w.date === d).reduce((a, w) => a + w.cost, 0),
      });
    }

    const topMap = new Map<string, { qty: number; profit: number }>();
    state.sales
      .filter((s) => s.date >= monthStart)
      .forEach((s) => {
        const cur = topMap.get(s.partName) ?? { qty: 0, profit: 0 };
        cur.qty += s.quantity;
        cur.profit += s.profit;
        topMap.set(s.partName, cur);
      });
    const top = [...topMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const activity = [
      ...state.sales.map((s) => ({
        key: `s${s.id}`,
        ts: s.ts,
        date: s.date,
        kind: "sale" as const,
        text: `${s.partName} — ${s.quantity} шт.`,
        amount: s.total,
      })),
      ...state.works.map((w) => ({
        key: `w${w.id}`,
        ts: w.ts,
        date: w.date,
        kind: "work" as const,
        text: `${w.car} — ${w.work}`,
        amount: w.cost,
      })),
      ...state.arrivals.map((a) => ({
        key: `a${a.id}`,
        ts: a.ts,
        date: a.date,
        kind: "arrival" as const,
        text: `${a.name} — ${a.quantity} шт.`,
        amount: a.quantity * a.buyPrice,
      })),
    ]
      .sort((x, y) => (y.date === x.date ? y.ts - x.ts : y.date.localeCompare(x.date)))
      .slice(0, 7);

    return {
      salesToday,
      profitToday,
      totalToday,
      worksSumToday,
      profitMonth,
      worksMonth,
      stockCost,
      stockMargin,
      lowStock,
      series,
      top,
      activity,
    };
  }, [state, today, monthStart]);

  const profitAnim = useCountUp(m.profitToday + m.worksSumToday);

  return (
    <div className="space-y-5">
      {/* ── HERO ── */}
      <motion.div {...fadeUp} transition={{ duration: 0.45 }}>
        <div className="relative overflow-hidden rounded-2xl border border-line">
          <img
            src="images/garage.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
          <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="orange" className="backdrop-blur">
                <CalendarDays size={12} />
                {todayHumanFull()}
              </Badge>
              <Badge tone="gray" className="backdrop-blur">
                Смена открыта
                <span className="relative ml-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                </span>
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand2">
                Прибыль сегодня
              </p>
              <p className="tnum mt-1 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {fmtMoney(profitAnim)}
              </p>
            </div>
            <div className="grid max-w-2xl grid-cols-3 gap-3">
              {[
                { l: "Выручка с продаж", v: fmtMoney(m.totalToday) },
                { l: "Доход от работ", v: fmtMoney(m.worksSumToday) },
                { l: "Операций сегодня", v: fmtInt(m.salesToday.length + state.works.filter((w) => w.date === today).length) },
              ].map((x) => (
                <div
                  key={x.l}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-sm"
                >
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {x.l}
                  </p>
                  <p className="tnum mt-0.5 truncate font-display text-sm font-bold text-white sm:text-lg">
                    {x.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            icon: Boxes,
            tone: "text-sky2 bg-sky2/12",
            label: "Склад",
            value: `${fmtInt(state.parts.length)} поз.`,
            sub: `закупка ${fmtMoney(m.stockCost)}`,
          },
          {
            icon: CircleDollarSign,
            tone: "text-mint bg-mint/12",
            label: "Потенциал склада",
            value: fmtMoney(m.stockMargin),
            sub: "маржа при продаже всего",
          },
          {
            icon: Trophy,
            tone: "text-gold bg-gold/12",
            label: "Прибыль за месяц",
            value: fmtMoney(m.profitMonth),
            sub: `работы ещё ${fmtMoney(m.worksMonth)}`,
          },
          {
            icon: Car,
            tone: "text-brand2 bg-brand/12",
            label: "Журнал авто",
            value: `${fmtInt(state.cars.length)} авто`,
            sub: `${fmtInt(state.carWorks.length + state.carParts.length)} записей`,
            onClick: () => go("cars"),
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.06 * (i + 1) }}
          >
            <Card
              className={
                "group h-full p-4 transition-colors hover:border-line2 " +
                (s.onClick ? "cursor-pointer" : "")
              }
            >
              <div className="flex items-start justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}>
                  <s.icon size={17} />
                </span>
                {s.onClick && (
                  <ChevronRight
                    size={15}
                    className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand2"
                  />
                )}
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {s.label}
              </p>
              <p className="tnum mt-0.5 font-display text-lg font-bold text-white">
                {s.value}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-faint">{s.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── CHART + LOW STOCK ── */}
      <div className="grid gap-4 xl:grid-cols-5">
        <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.25 }} className="xl:col-span-3">
          <Card className="h-full">
            <CardHead
              icon={CircleDollarSign}
              title="Динамика за 14 дней"
              hint="Прибыль с продаж + доход от работ"
              actions={
                <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-t from-[#ef5f05] to-[#ff9a45]" />
                    Продажи
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky2" />
                    Работы
                  </span>
                </div>
              }
            />
            <div className="p-5">
              <Bars data={m.series} />
            </div>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.3 }} className="xl:col-span-2">
          <Card className="h-full">
            <CardHead
              icon={AlertTriangle}
              tone="mint"
              title="Заканчивается"
              hint={m.lowStock.length ? `${m.lowStock.length} поз. с остатком ≤ 3` : "Всё в норме"}
              actions={
                <button
                  onClick={() => go("parts")}
                  className="text-[11px] font-bold uppercase tracking-wider text-brand2 transition hover:text-white"
                >
                  Склад →
                </button>
              }
            />
            <div className="divide-y divide-line/60">
              {m.lowStock.length === 0 && (
                <p className="p-5 text-sm text-muted">Остатки в порядке — всё выше 3 шт.</p>
              )}
              {m.lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel3 text-faint">
                    <Box size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-200">{p.name}</p>
                    <p className="text-[11px] text-faint">
                      {p.artikul || "без артикула"} · {firmName(p.firmId)}
                    </p>
                  </div>
                  <Badge tone={p.quantity === 0 ? "red" : "gold"}>
                    {p.quantity === 0 ? "нет на складе" : `осталось ${p.quantity}`}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── ACTIVITY + TOP ── */}
      <div className="grid gap-4 xl:grid-cols-5">
        <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.35 }} className="xl:col-span-3">
          <Card className="h-full">
            <CardHead icon={ShoppingCart} tone="sky" title="Последние операции" hint="Продажи, работы и поступления" />
            <div className="divide-y divide-line/60">
              {m.activity.map((a) => (
                <div key={a.key} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
                      (a.kind === "sale"
                        ? "bg-brand/12 text-brand2"
                        : a.kind === "work"
                          ? "bg-sky2/12 text-sky2"
                          : "bg-mint/12 text-mint")
                    }
                  >
                    {a.kind === "sale" ? <ShoppingCart size={14} /> : a.kind === "work" ? <Wrench size={14} /> : <PackagePlus size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-200">{a.text}</p>
                    <p className="text-[11px] text-faint">
                      {a.kind === "sale" ? "Продажа" : a.kind === "work" ? "Работа" : "Поступление"} · {fmtDate(a.date)}
                    </p>
                  </div>
                  <p
                    className={
                      "tnum text-[13px] font-bold " +
                      (a.kind === "arrival" ? "text-muted" : a.kind === "sale" ? "text-brand2" : "text-sky2")
                    }
                  >
                    {a.kind === "arrival" ? "−" : "+"}
                    {fmtMoney(a.amount)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.45, delay: 0.4 }} className="xl:col-span-2">
          <Card className="h-full">
            <CardHead icon={Trophy} title="Топ продаж · месяц" hint="По количеству проданных" />
            <div className="space-y-4 p-5">
              {m.top.length === 0 && <p className="text-sm text-muted">В этом месяце продаж пока не было.</p>}
              {m.top.map((t, i) => {
                const maxQty = m.top[0]?.qty || 1;
                return (
                  <div key={t.name}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-slate-200">
                        <span className="mr-1.5 font-display text-faint">{i + 1}.</span>
                        {t.name}
                      </p>
                      <p className="tnum shrink-0 text-[12px] font-bold text-brand2">
                        {fmtInt(t.qty)} шт.
                      </p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-panel3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(t.qty / maxQty) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-[#ef5f05] to-[#ffb25e]"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-faint">прибыль {fmtMoney(t.profit)}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/* ────────────── Bar chart ────────────── */

function Bars({ data }: { data: DayPoint[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.sales + d.works));
  const n = data.length;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 bottom-6 top-0">
        {[0.25, 0.5, 0.75].map((k) => (
          <div key={k} className="absolute inset-x-0 border-t border-line/50" style={{ bottom: `${k * 100}%` }} />
        ))}
      </div>
      <div className="relative flex h-44 items-end gap-1.5">
        {data.map((d, i) => {
          const sh = (d.sales / max) * 100;
          const wh = (d.works / max) * 100;
          return (
            <div
              key={d.date}
              className="relative flex-1 cursor-pointer"
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            >
              <div className={"absolute inset-0 rounded-md transition " + (hov === i ? "bg-white/[0.04]" : "")} />
              <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end" style={{ height: "100%" }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${sh}%` }}
                  transition={{ duration: 0.6, delay: i * 0.03, ease: "easeOut" }}
                  className={"w-full " + (sh > 0 ? "min-h-[2px] rounded-t-[3px] bg-gradient-to-t from-[#ef5f05] to-[#ff9a45] " : "") + (wh === 0 && sh > 0 ? "rounded-b-[3px]" : "")}
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${wh}%` }}
                  transition={{ duration: 0.6, delay: i * 0.03, ease: "easeOut" }}
                  className={"mt-[2px] w-full " + (wh > 0 ? "min-h-[2px] rounded-b-[3px] bg-sky2/70 " : "") + (sh === 0 && wh > 0 ? "rounded-t-[3px]" : "")}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <p key={d.date} className="flex-1 text-center text-[9px] font-semibold text-faint">
            {i % 3 === 0 || i === n - 1 ? fmtDateShort(d.date) : ""}
          </p>
        ))}
      </div>
      {hov !== null && (
        <div
          className="pointer-events-none absolute -top-2 z-20 w-40 -translate-x-1/2 -translate-y-full rounded-xl border border-line2 bg-panel3/95 p-2.5 text-[11px] shadow-xl shadow-black/50 backdrop-blur"
          style={{ left: `${((hov + 0.5) / n) * 100}%` }}
        >
          <p className="mb-1 font-display font-bold text-white">{fmtDate(data[hov].date)}</p>
          <p className="flex justify-between text-brand2">
            <span>Продажи</span>
            <span className="tnum font-bold">{fmtMoney(data[hov].sales)}</span>
          </p>
          <p className="flex justify-between text-sky2">
            <span>Работы</span>
            <span className="tnum font-bold">{fmtMoney(data[hov].works)}</span>
          </p>
          <p className="mt-1 flex justify-between border-t border-line pt-1 text-slate-200">
            <span>Итого</span>
            <span className="tnum font-bold">{fmtMoney(data[hov].sales + data[hov].works)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
