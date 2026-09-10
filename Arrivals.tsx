import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Info, PackagePlus, RotateCcw, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toaster";
import {
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
import { fmtDate, fmtMoney, fmtNum, isISO, parseNum, round2, todayISO } from "../lib/utils";
import type { Arrival } from "../lib/types";

export default function Arrivals() {
  const { state, firmName, addArrival, deleteArrival } = useStore();
  const toast = useToast();

  const [date, setDate] = useState(todayISO());
  const [artikul, setArtikul] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [buy, setBuy] = useState("");
  const [markup, setMarkup] = useState("30");
  const [sell, setSell] = useState("");
  const [firm, setFirm] = useState("");
  const sellTouched = useRef(false);

  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /* авто-расчёт цены продажи по наценке */
  useEffect(() => {
    if (sellTouched.current) return;
    const b = parseNum(buy);
    const m = parseNum(markup);
    if (Number.isFinite(b) && Number.isFinite(m)) {
      setSell(String(round2(b * (1 + m / 100))));
    } else {
      setSell("");
    }
  }, [buy, markup]);

  /* автозаполнение по артикулу */
  const onArtikul = (v: string) => {
    setArtikul(v);
    const found = state.parts.find(
      (p) => p.artikul && p.artikul.toLowerCase() === v.trim().toLowerCase()
    );
    if (found) {
      setName(found.name);
      setBuy(String(found.buyPrice));
      sellTouched.current = true;
      setSell(String(found.sellPrice));
      setFirm(found.firmId ? firmName(found.firmId) : "");
      toast.info(`Найдено на складе: ${found.name}`);
    }
  };

  const reset = () => {
    setDate(todayISO());
    setArtikul("");
    setName("");
    setQty("");
    setBuy("");
    setSell("");
    setFirm("");
    sellTouched.current = false;
  };

  const submit = () => {
    const q = parseInt(qty, 10);
    const b = parseNum(buy);
    const s = parseNum(sell);
    if (!name.trim()) return toast.error("Введите название запчасти");
    if (!isISO(date)) return toast.error("Укажите дату");
    if (!Number.isInteger(q) || q <= 0) return toast.error("Количество должно быть целым числом больше 0");
    if (!Number.isFinite(b) || b < 0) return toast.error("Некорректная цена покупки");
    if (!Number.isFinite(s) || s < 0) return toast.error("Некорректная цена продажи");
    const r = addArrival({
      date,
      name: name.trim(),
      artikul: artikul.trim(),
      quantity: q,
      buyPrice: b,
      sellPrice: s,
      firmName: firm.trim(),
    });
    if (r.ok) {
      toast.success(`Принято на склад: ${name.trim()} × ${q} шт.`);
      reset();
    }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...state.arrivals].sort(
      (a, b) => (a.date === b.date ? b.ts - a.ts : b.date.localeCompare(a.date))
    );
    if (!q) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.artikul.toLowerCase().includes(q) ||
        firmName(r.firmId).toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.arrivals, search]);

  const totalSum = rows.reduce((a, r) => a + r.quantity * r.buyPrice, 0);

  const cols: Col<Arrival>[] = [
    { title: "Дата", render: (r) => <span className="tnum text-muted">{fmtDate(r.date)}</span>, raw: (r) => fmtDate(r.date) },
    { title: "Название", render: (r) => <span className="font-medium text-slate-200">{r.name}</span>, raw: (r) => r.name },
    { title: "Артикул", align: "c", render: (r) => <span className="tnum text-muted">{r.artikul || "—"}</span>, raw: (r) => r.artikul },
    { title: "Кол-во", align: "c", render: (r) => <span className="tnum">{r.quantity}</span>, raw: (r) => String(r.quantity) },
    { title: "Цена покупки", align: "r", render: (r) => <span className="tnum">{fmtNum(r.buyPrice)}</span>, raw: (r) => fmtNum(r.buyPrice) },
    { title: "Цена продажи", align: "r", render: (r) => <span className="tnum text-brand2">{fmtNum(r.sellPrice)}</span>, raw: (r) => fmtNum(r.sellPrice) },
    { title: "Сумма закупки", align: "r", render: (r) => <span className="tnum font-semibold">{fmtNum(r.quantity * r.buyPrice)}</span>, raw: (r) => fmtNum(r.quantity * r.buyPrice) },
    { title: "Фирма", align: "c", render: (r) => <span className="text-muted">{firmName(r.firmId)}</span>, raw: (r) => firmName(r.firmId) },
    {
      title: "",
      align: "c",
      render: (r) => (
        <IconBtn icon={Trash2} title="Удалить запись" tone="danger" onClick={() => setConfirmId(r.id)} />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardHead
            icon={PackagePlus}
            title="Новое поступление"
            hint="Запчасть автоматически появится на складе или прибавится к существующей"
          />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              <Field label="Дата">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Артикул" hint="автозаполнение" className="xl:col-span-2">
                <Input value={artikul} onChange={(e) => onArtikul(e.target.value)} placeholder="BP-1180" />
              </Field>
              <Field label="Название запчасти" className="col-span-2 xl:col-span-5">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Фильтр масляный" onKeyDown={(e) => e.key === "Enter" && submit()} />
              </Field>
              <Field label="Кол-во">
                <Input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="10" onKeyDown={(e) => e.key === "Enter" && submit()} />
              </Field>
              <Field label="Цена покупки">
                <Input inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Наценка %">
                <Input inputMode="decimal" value={markup} onChange={(e) => setMarkup(e.target.value)} />
              </Field>
              <Field label="Цена продажи" hint="считается автоматически">
                <Input
                  inputMode="decimal"
                  value={sell}
                  onChange={(e) => {
                    sellTouched.current = true;
                    setSell(e.target.value);
                  }}
                />
              </Field>
              <Field label="Фирма" hint="необязательно" className="col-span-2">
                <Input list="firms-list" value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="Bosch" />
                <datalist id="firms-list">
                  {state.firms.map((f) => (
                    <option key={f.id} value={f.name} />
                  ))}
                </datalist>
              </Field>
              <div className="col-span-2 flex items-end gap-2 md:col-span-4 xl:col-span-2 xl:justify-end">
                <Button variant="success" icon={PackagePlus} onClick={submit} className="flex-1 xl:flex-none">
                  Принять на склад
                </Button>
                <Button icon={RotateCcw} onClick={reset} title="Очистить" />
              </div>
            </div>
            <p className="flex items-start gap-2 rounded-xl border border-line bg-panel2/60 px-3 py-2.5 text-[12px] leading-relaxed text-muted">
              <Info size={14} className="mt-0.5 shrink-0 text-sky2" />
              Если запчасть с таким названием и фирмой уже есть на складе — количество прибавится,
              а цены и артикул обновятся.
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
        <Card>
          <CardHead
            icon={PackagePlus}
            tone="sky"
            title="История поступлений"
            hint={`${rows.length} записей · закуплено на ${fmtMoney(totalSum)}`}
            actions={<SearchInput value={search} onChange={setSearch} placeholder="Название, артикул, фирма…" className="w-56" />}
          />
          <DataTable
            cols={cols}
            rows={rows}
            rowKey={(r) => r.id}
            empty={{ title: "Поступлений пока нет", hint: "Добавьте первое поступление через форму выше" }}
          />
        </Card>
      </motion.div>

      <ConfirmModal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) deleteArrival(confirmId);
          toast.success("Запись о поступлении удалена");
        }}
        title="Удалить поступление?"
        message="Запись о поступлении будет удалена. Количество запчасти на складе при этом не изменится."
      />
    </div>
  );
}
