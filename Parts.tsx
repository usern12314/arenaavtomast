import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Boxes, CalendarCheck, CircleDollarSign, Pencil, Plus, Trash2, Wallet } from "lucide-react";
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
  Modal,
  SearchInput,
} from "../components/ui";
import { fmtInt, fmtMoney, fmtNum, parseNum, round2, todayISO } from "../lib/utils";
import type { Part } from "../lib/types";

export default function Parts() {
  const { state, firmName, addPart, deletePart } = useStore();
  const toast = useToast();

  /* форма добавления */
  const [fName, setFName] = useState("");
  const [fArt, setFArt] = useState("");
  const [fFirm, setFFirm] = useState("");
  const [fQty, setFQty] = useState("");
  const [fBuy, setFBuy] = useState("");
  const [fMarkup, setFMarkup] = useState("30");
  const [fSell, setFSell] = useState("");
  const sellTouched = useRef(false);

  useEffect(() => {
    if (sellTouched.current) return;
    const b = parseNum(fBuy);
    const mk = parseNum(fMarkup);
    setFSell(Number.isFinite(b) && Number.isFinite(mk) ? String(round2(b * (1 + mk / 100))) : "");
  }, [fBuy, fMarkup]);

  const [firmFilter, setFirmFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Part | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dayProfitOpen, setDayProfitOpen] = useState(false);

  const stats = useMemo(() => {
    const cost = state.parts.reduce((a, p) => a + p.quantity * p.buyPrice, 0);
    const margin = state.parts.reduce((a, p) => a + p.quantity * (p.sellPrice - p.buyPrice), 0);
    return { count: state.parts.length, cost, margin };
  }, [state.parts]);

  const day = useMemo(() => {
    const t = todayISO();
    const sp = state.sales.filter((s) => s.date === t).reduce((a, s) => a + s.profit, 0);
    const wt = state.works.filter((w) => w.date === t).reduce((a, w) => a + w.cost, 0);
    return { sp, wt };
  }, [state.sales, state.works]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.parts
      .filter((p) => (firmFilter ? p.firmId === firmFilter : true))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.artikul.toLowerCase().includes(q) ||
          firmName(p.firmId).toLowerCase().includes(q)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.parts, firmFilter, search]);

  const submit = () => {
    const q = parseInt(fQty, 10);
    const b = parseNum(fBuy);
    const s = parseNum(fSell);
    if (!fName.trim()) return toast.error("Введите название");
    if (!Number.isInteger(q) || q <= 0) return toast.error("Количество — целое число больше 0");
    if (!Number.isFinite(b) || b < 0) return toast.error("Некорректная цена покупки");
    if (!Number.isFinite(s) || s < 0) return toast.error("Некорректная цена продажи");
    addPart({
      name: fName.trim(),
      artikul: fArt.trim(),
      quantity: q,
      buyPrice: b,
      sellPrice: s,
      firmName: fFirm.trim(),
    });
    toast.success(`«${fName.trim()}» добавлена на склад`);
    setFName(""); setFArt(""); setFFirm(""); setFQty(""); setFBuy(""); setFSell("");
    sellTouched.current = false;
  };

  const qtyBadge = (qty: number) =>
    qty === 0 ? (
      <Badge tone="red">0 — закончилась</Badge>
    ) : qty <= 3 ? (
      <Badge tone="gold">{qty} — мало</Badge>
    ) : (
      <Badge tone="gray">{qty} шт.</Badge>
    );

  const cols: Col<Part>[] = [
    { title: "Название", render: (r) => <span className="font-medium text-slate-100">{r.name}</span>, raw: (r) => r.name },
    { title: "Артикул", align: "c", render: (r) => <span className="tnum text-muted">{r.artikul || "—"}</span>, raw: (r) => r.artikul },
    { title: "Остаток", align: "c", render: (r) => qtyBadge(r.quantity), raw: (r) => String(r.quantity) },
    { title: "Закупка", align: "r", render: (r) => <span className="tnum">{fmtNum(r.buyPrice)}</span>, raw: (r) => fmtNum(r.buyPrice) },
    { title: "Продажа", align: "r", render: (r) => <span className="tnum text-brand2">{fmtNum(r.sellPrice)}</span>, raw: (r) => fmtNum(r.sellPrice) },
    {
      title: "Маржа / шт.",
      align: "r",
      render: (r) => <span className="tnum font-semibold text-mint">+{fmtNum(r.sellPrice - r.buyPrice)}</span>,
      raw: (r) => fmtNum(r.sellPrice - r.buyPrice),
    },
    { title: "Фирма", align: "c", render: (r) => <span className="text-muted">{firmName(r.firmId)}</span>, raw: (r) => firmName(r.firmId) },
    {
      title: "",
      align: "c",
      render: (r) => (
        <div className="flex justify-center gap-1">
          <IconBtn icon={Pencil} title="Редактировать" tone="orange" onClick={() => setEditing(r)} />
          <IconBtn icon={Trash2} title="Удалить" tone="danger" onClick={() => setConfirmId(r.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* статистика склада */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { icon: Boxes, tone: "text-sky2 bg-sky2/12", label: "Позиций на складе", value: fmtInt(stats.count) },
          { icon: Wallet, tone: "text-gold bg-gold/12", label: "Сумма закупки", value: fmtMoney(stats.cost) },
          { icon: CircleDollarSign, tone: "text-mint bg-mint/12", label: "Потенциальная маржа", value: fmtMoney(stats.margin) },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
              <s.icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="tnum truncate font-display text-lg font-bold text-white">{s.value}</p>
            </div>
          </Card>
        ))}
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted">Итог дня</p>
            <p className="tnum truncate font-display text-lg font-bold text-mint">{fmtMoney(day.sp + day.wt)}</p>
          </div>
          <Button variant="sky" size="sm" icon={CalendarCheck} onClick={() => setDayProfitOpen(true)}>
            Детально
          </Button>
        </Card>
      </motion.div>

      {/* форма добавления */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
        <Card>
          <CardHead icon={Plus} title="Добавить запчасть вручную" hint="Если позиция уже есть — количество прибавится" />
          <div className="grid grid-cols-2 items-end gap-3 p-5 md:grid-cols-4 xl:grid-cols-8">
            <Field label="Название" className="col-span-2">
              <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Колодки тормозные" />
            </Field>
            <Field label="Артикул">
              <Input value={fArt} onChange={(e) => setFArt(e.target.value)} placeholder="BP-1180" />
            </Field>
            <Field label="Фирма">
              <Input list="firms-list" value={fFirm} onChange={(e) => setFFirm(e.target.value)} placeholder="Lynx" />
              <datalist id="firms-list">
                {state.firms.map((f) => (
                  <option key={f.id} value={f.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Кол-во">
              <Input inputMode="numeric" value={fQty} onChange={(e) => setFQty(e.target.value)} placeholder="1" />
            </Field>
            <Field label="Закупка">
              <Input inputMode="decimal" value={fBuy} onChange={(e) => setFBuy(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Наценка %">
              <Input inputMode="decimal" value={fMarkup} onChange={(e) => setFMarkup(e.target.value)} />
            </Field>
            <div className="col-span-2 grid grid-cols-[1fr_auto] items-end gap-2 md:col-span-4 xl:col-span-1">
              <Field label="Продажа">
                <Input
                  inputMode="decimal"
                  value={fSell}
                  onChange={(e) => {
                    sellTouched.current = true;
                    setFSell(e.target.value);
                  }}
                />
              </Field>
            </div>
            <div className="col-span-2 md:col-span-4 xl:col-span-8 xl:flex xl:justify-end">
              <Button variant="success" icon={Plus} onClick={submit}>
                Добавить на склад
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* список */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
        <Card>
          <CardHead
            icon={Boxes}
            tone="sky"
            title="Склад"
            hint={`${rows.length} позиций · двойной клик по ячейке — скопировать значение`}
            actions={<SearchInput value={search} onChange={setSearch} placeholder="Название, артикул, фирма…" className="w-56" />}
          />
          <div className="flex flex-wrap gap-1.5 border-b border-line px-5 py-3">
            <FirmChip active={firmFilter === null} onClick={() => setFirmFilter(null)} label={`Все · ${state.parts.length}`} />
            {state.firms.map((f) => (
              <FirmChip
                key={f.id}
                active={firmFilter === f.id}
                onClick={() => setFirmFilter(firmFilter === f.id ? null : f.id)}
                label={`${f.name} · ${state.parts.filter((p) => p.firmId === f.id).length}`}
              />
            ))}
          </div>
          <DataTable
            cols={cols}
            rows={rows}
            rowKey={(r) => r.id}
            empty={{ title: "Склад пуст", hint: "Добавьте позицию вручную или через «Поступление»" }}
          />
        </Card>
      </motion.div>

      {/* редактирование */}
      <EditPartModal part={editing} onClose={() => setEditing(null)} />

      <ConfirmModal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) deletePart(confirmId);
          toast.success("Запчасть удалена со склада");
        }}
        title="Удалить запчасть?"
        message="Позиция будет удалена со склада без возможности восстановления. История продаж сохранится."
      />

      {/* прибыль за день */}
      <Modal open={dayProfitOpen} onClose={() => setDayProfitOpen(false)} title="Прибыль за сегодня" subtitle="Продажи + работы">
        <div className="space-y-3">
          {[
            { l: "Прибыль от продаж запчастей", v: day.sp, c: "text-brand2" },
            { l: "Доход от работ", v: day.wt, c: "text-sky2" },
          ].map((r) => (
            <div key={r.l} className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-4 py-3">
              <span className="text-sm text-muted">{r.l}</span>
              <span className={`tnum font-display text-lg font-bold ${r.c}`}>{fmtMoney(r.v)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl border border-mint/30 bg-mint/10 px-4 py-3.5">
            <span className="text-sm font-semibold text-mint">Итого за день</span>
            <span className="tnum font-display text-xl font-bold text-mint">{fmtMoney(day.sp + day.wt)}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FirmChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition " +
        (active
          ? "border-brand/50 bg-brand/15 text-brand2"
          : "border-line bg-panel2 text-muted hover:border-line2 hover:text-slate-200")
      }
    >
      {label}
    </button>
  );
}

function EditPartModal({ part, onClose }: { part: Part | null; onClose: () => void }) {
  const { updatePart, state } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [art, setArt] = useState("");
  const [firm, setFirm] = useState("");
  const [qty, setQty] = useState("");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");

  useEffect(() => {
    if (part) {
      setName(part.name);
      setArt(part.artikul);
      setFirm(part.firmId ? state.firms.find((f) => f.id === part.firmId)?.name ?? "" : "");
      setQty(String(part.quantity));
      setBuy(String(part.buyPrice));
      setSell(String(part.sellPrice));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part?.id]);

  const save = () => {
    if (!part) return;
    const q = parseInt(qty, 10);
    const b = parseNum(buy);
    const s = parseNum(sell);
    if (!name.trim()) return toast.error("Введите название");
    if (!Number.isInteger(q) || q < 0) return toast.error("Некорректное количество");
    if (!Number.isFinite(b) || b < 0) return toast.error("Некорректная закупка");
    if (!Number.isFinite(s) || s < 0) return toast.error("Некорректная продажа");
    updatePart(part.id, {
      name: name.trim(),
      artikul: art.trim(),
      quantity: q,
      buyPrice: b,
      sellPrice: s,
      firmName: firm.trim(),
    });
    toast.success("Запчасть обновлена");
    onClose();
  };

  return (
    <Modal open={!!part} onClose={onClose} title="Редактировать запчасть" subtitle={part?.name}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Название" className="col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Артикул">
          <Input value={art} onChange={(e) => setArt(e.target.value)} />
        </Field>
        <Field label="Фирма">
          <Input list="firms-list-modal" value={firm} onChange={(e) => setFirm(e.target.value)} />
          <datalist id="firms-list-modal">
            {state.firms.map((f) => (
              <option key={f.id} value={f.name} />
            ))}
          </datalist>
        </Field>
        <Field label="Кол-во">
          <Input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Цена покупки">
          <Input inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value)} />
        </Field>
        <Field label="Цена продажи" className="col-span-2">
          <Input inputMode="decimal" value={sell} onChange={(e) => setSell(e.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="primary" onClick={save}>
          Сохранить
        </Button>
      </div>
    </Modal>
  );
}
