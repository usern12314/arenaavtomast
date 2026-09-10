import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ShoppingCart, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toaster";
import {
  Badge,
  Button,
  Card,
  CardHead,
  Col,
  ConfirmModal,
  DataTable,
  Field,
  IconBtn,
  Input,
  SearchInput,
} from "../components/ui";
import { fmtDate, fmtInt, fmtMoney, fmtNum, todayISO } from "../lib/utils";
import type { Part, Sale } from "../lib/types";

export default function Sales() {
  const { state, sellPart, deleteSale } = useStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [qty, setQty] = useState("1");
  const [openDrop, setOpenDrop] = useState(false);
  const [hi, setHi] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const blurTimer = useRef<number | null>(null);

  const available = useMemo(
    () => state.parts.filter((p) => p.quantity > 0),
    [state.parts]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? available.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.artikul.toLowerCase().includes(q)
        )
      : available;
    return list.slice(0, 8);
  }, [available, query]);

  const selected: Part | undefined = state.parts.find(
    (p) => p.name.toLowerCase() === query.trim().toLowerCase()
  );

  const qNum = parseInt(qty, 10);
  const validQty = Number.isInteger(qNum) && qNum > 0;
  const canSell = !!selected && validQty && qNum <= selected.quantity;
  const total = selected && validQty ? qNum * selected.sellPrice : 0;
  const profit = selected && validQty ? qNum * (selected.sellPrice - selected.buyPrice) : 0;

  const pick = (p: Part) => {
    setQuery(p.name);
    setOpenDrop(false);
  };

  const sell = () => {
    if (!selected) return toast.error("Выберите запчасть из списка");
    if (!validQty) return toast.error("Введите корректное количество");
    const r = sellPart(selected.name, qNum);
    if (!r.ok) return toast.error(r.error ?? "Не удалось продать");
    toast.success(
      `Продано: ${qNum} шт. × ${fmtNum(selected.sellPrice)} = ${fmtMoney(total)} · прибыль ${fmtMoney(profit)}`
    );
    setQuery("");
    setQty("1");
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...state.sales].sort((a, b) =>
      a.date === b.date ? b.ts - a.ts : b.date.localeCompare(a.date)
    );
    return q ? list.filter((r) => r.partName.toLowerCase().includes(q)) : list;
  }, [state.sales, search]);

  const todayStats = useMemo(() => {
    const t = todayISO();
    const list = state.sales.filter((s) => s.date === t);
    return {
      count: list.length,
      sum: list.reduce((a, s) => a + s.total, 0),
      profit: list.reduce((a, s) => a + s.profit, 0),
    };
  }, [state.sales]);

  const cols: Col<Sale>[] = [
    { title: "Дата", render: (r) => <span className="tnum text-muted">{fmtDate(r.date)}</span>, raw: (r) => fmtDate(r.date) },
    { title: "Запчасть", render: (r) => <span className="font-medium text-slate-100">{r.partName}</span>, raw: (r) => r.partName },
    { title: "Кол-во", align: "c", render: (r) => <span className="tnum">{r.quantity}</span>, raw: (r) => String(r.quantity) },
    { title: "Цена", align: "r", render: (r) => <span className="tnum">{fmtNum(r.sellPrice)}</span>, raw: (r) => fmtNum(r.sellPrice) },
    { title: "Сумма", align: "r", render: (r) => <span className="tnum font-semibold">{fmtNum(r.total)}</span>, raw: (r) => fmtNum(r.total) },
    { title: "Прибыль", align: "r", render: (r) => <span className="tnum font-semibold text-mint">+{fmtNum(r.profit)}</span>, raw: (r) => fmtNum(r.profit) },
    {
      title: "",
      align: "c",
      render: (r) => (
        <IconBtn icon={Trash2} title="Удалить (вернуть на склад)" tone="danger" onClick={() => setConfirmId(r.id)} />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardHead
            icon={ShoppingCart}
            title="Продажа запчасти"
            hint={`Сегодня: ${fmtInt(todayStats.count)} продаж на ${fmtMoney(todayStats.sum)}`}
          />
          <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <Field label="Запчасть" hint={selected ? `выбрано: ${selected.name}` : "начните вводить название или артикул"}>
                <div className="relative">
                  <Input
                    value={query}
                    placeholder="Например: фильтр масляный…"
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setOpenDrop(true);
                      setHi(0);
                    }}
                    onFocus={() => setOpenDrop(true)}
                    onBlur={() => {
                      blurTimer.current = window.setTimeout(() => setOpenDrop(false), 150);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" && openDrop) {
                        e.preventDefault();
                        setHi((h) => Math.min(h + 1, suggestions.length - 1));
                      } else if (e.key === "ArrowUp" && openDrop) {
                        e.preventDefault();
                        setHi((h) => Math.max(h - 1, 0));
                      } else if (e.key === "Enter") {
                        if (openDrop && suggestions[hi]) pick(suggestions[hi]);
                        else sell();
                      } else if (e.key === "Escape") {
                        setOpenDrop(false);
                      }
                    }}
                  />
                  <AnimatePresence>
                    {openDrop && suggestions.length > 0 && !selected && (
                      <motion.ul
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-line2 bg-panel3 shadow-2xl shadow-black/60"
                      >
                        {suggestions.map((p, i) => (
                          <li key={p.id}>
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pick(p);
                              }}
                              onMouseEnter={() => setHi(i)}
                              className={
                                "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition " +
                                (i === hi ? "bg-brand/15" : "")
                              }
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-[13px] font-medium text-slate-100">{p.name}</span>
                                <span className="tnum block text-[11px] text-faint">{p.artikul || "без артикула"}</span>
                              </span>
                              <span className="tnum shrink-0 text-[11px] font-semibold text-muted">
                                {p.quantity} шт. · {fmtNum(p.sellPrice)} ₽
                              </span>
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </Field>

              <div className="mt-4 flex items-end gap-3">
                <Field label="Количество" className="w-32">
                  <Input
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sell()}
                  />
                </Field>
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={sell}
                  disabled={!canSell}
                  className="h-[42px] flex-1 sm:flex-none sm:px-8"
                >
                  Продать{canSell ? ` на ${fmtMoney(total)}` : ""}
                </Button>
              </div>
            </div>

            {/* карточка выбранной запчасти */}
            <div
              className={
                "rounded-xl border p-4 transition-colors " +
                (selected ? "border-mint/30 bg-mint/[0.06]" : "border-dashed border-line2 bg-panel2/40")
              }
            >
              {selected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BadgeCheck size={16} className="text-mint" />
                    <p className="truncate text-[13px] font-bold text-white">{selected.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <InfoCell l="В наличии" v={`${selected.quantity} шт.`} tone={selected.quantity <= 3 ? "text-gold" : "text-white"} />
                    <InfoCell l="Цена продажи" v={`${fmtNum(selected.sellPrice)} ₽`} tone="text-brand2" />
                    <InfoCell l="Цена закупки" v={`${fmtNum(selected.buyPrice)} ₽`} />
                    <InfoCell l="Маржа с 1 шт." v={`+${fmtNum(selected.sellPrice - selected.buyPrice)} ₽`} tone="text-mint" />
                  </div>
                  {canSell && (
                    <div className="flex items-center justify-between rounded-lg border border-line bg-ink/40 px-3 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Прибыль со сделки</span>
                      <span className="tnum font-display text-base font-bold text-mint">+{fmtMoney(profit)}</span>
                    </div>
                  )}
                  {validQty && qNum > selected.quantity && (
                    <Badge tone="red">на складе только {selected.quantity} шт.</Badge>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center">
                  <ShoppingCart size={22} className="text-line2" />
                  <p className="text-[12px] text-faint">
                    Выберите запчасть из списка —<br />здесь появятся остаток и цены
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
        <Card>
          <CardHead
            icon={ShoppingCart}
            tone="mint"
            title="История продаж"
            hint={`${rows.length} записей · прибыль ${fmtMoney(rows.reduce((a, r) => a + r.profit, 0))}`}
            actions={<SearchInput value={search} onChange={setSearch} placeholder="Поиск по названию…" className="w-52" />}
          />
          <DataTable
            cols={cols}
            rows={rows}
            rowKey={(r) => r.id}
            empty={{ title: "Продаж пока нет" }}
          />
        </Card>
      </motion.div>

      <ConfirmModal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) deleteSale(confirmId);
          toast.success("Продажа удалена — товар возвращён на склад");
        }}
        title="Удалить продажу?"
        message="Запись о продаже будет удалена, а товар вернётся на склад в прежнем количестве."
      />
    </div>
  );
}

function InfoCell({ l, v, tone = "text-slate-200" }: { l: string; v: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink/30 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">{l}</p>
      <p className={`tnum mt-0.5 font-bold ${tone}`}>{v}</p>
    </div>
  );
}
