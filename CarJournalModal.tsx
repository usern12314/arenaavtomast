import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Printer, Trash2, Wrench, Cog } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "./Toaster";
import {
  Badge,
  Button,
  Col,
  ConfirmModal,
  DataTable,
  Field,
  IconBtn,
  Input,
  Modal,
  Segmented,
} from "./ui";
import { fmtDate, fmtMoney, fmtNum, isISO, parseNum, todayISO } from "../lib/utils";
import { printCarJournal } from "../lib/print";
import type { CarPart, CarWork } from "../lib/types";

export default function CarJournalModal({
  carId,
  onClose,
}: {
  carId: string | null;
  onClose: () => void;
}) {
  const { state, addCarWork, updateCarWork, deleteCarWork, addCarPart, updateCarPart, deleteCarPart } = useStore();
  const toast = useToast();
  const car = state.cars.find((c) => c.id === carId);
  const [tab, setTab] = useState<"works" | "parts">("works");

  useEffect(() => {
    if (carId) setTab("works");
  }, [carId]);

  const works = useMemo(
    () =>
      state.carWorks
        .filter((w) => w.carId === carId)
        .sort((a, b) => (a.date === b.date ? b.ts - a.ts : b.date.localeCompare(a.date))),
    [state.carWorks, carId]
  );
  const parts = useMemo(
    () =>
      state.carParts
        .filter((p) => p.carId === carId)
        .sort((a, b) => (a.date === b.date ? b.ts - a.ts : b.date.localeCompare(a.date))),
    [state.carParts, carId]
  );

  const wTotal = works.reduce((a, w) => a + w.cost, 0);
  const pTotal = parts.reduce((a, p) => a + p.quantity * p.price, 0);

  /* ── формы добавления ── */
  const [wDate, setWDate] = useState(todayISO());
  const [wDesc, setWDesc] = useState("");
  const [wCost, setWCost] = useState("");

  const [pDate, setPDate] = useState(todayISO());
  const [pArt, setPArt] = useState("");
  const [pName, setPName] = useState("");
  const [pQty, setPQty] = useState("1");
  const [pPrice, setPPrice] = useState("");

  const [editW, setEditW] = useState<CarWork | null>(null);
  const [editP, setEditP] = useState<CarPart | null>(null);
  const [confirmW, setConfirmW] = useState<string | null>(null);
  const [confirmP, setConfirmP] = useState<string | null>(null);

  if (!carId) return null;

  const submitWork = () => {
    const c = parseNum(wCost);
    if (!wDesc.trim()) return toast.error("Введите описание работы");
    if (!isISO(wDate)) return toast.error("Укажите дату");
    addCarWork({
      carId,
      date: wDate,
      description: wDesc.trim(),
      cost: Number.isFinite(c) ? c : 0,
    });
    toast.success("Работа добавлена в журнал");
    setWDesc("");
    setWCost("");
    setWDate(todayISO());
  };

  const onArtikul = (v: string) => {
    setPArt(v);
    const found = state.parts.find(
      (p) => p.artikul && p.artikul.toLowerCase() === v.trim().toLowerCase()
    );
    if (found) {
      setPName(found.name);
      setPPrice(String(found.sellPrice));
      toast.info(`Со склада: ${found.name} · остаток ${found.quantity} шт.`);
    }
  };

  const submitPart = () => {
    const q = parseInt(pQty, 10);
    const pr = parseNum(pPrice);
    if (!pName.trim()) return toast.error("Введите название запчасти");
    if (!isISO(pDate)) return toast.error("Укажите дату");
    if (!Number.isInteger(q) || q <= 0) return toast.error("Количество — целое число больше 0");
    const r = addCarPart({
      carId,
      date: pDate,
      partName: pName.trim(),
      artikul: pArt.trim(),
      quantity: q,
      price: Number.isFinite(pr) ? pr : 0,
    });
    if (r.warning) toast.error(r.warning);
    else toast.success("Запчасть добавлена в журнал");
    setPDate(todayISO());
    setPArt("");
    setPName("");
    setPQty("1");
    setPPrice("");
  };

  const partSum = (parseNum(pQty) || 0) * (parseNum(pPrice) || 0);

  const colsW: Col<CarWork>[] = [
    { title: "Дата", render: (r) => <span className="tnum text-muted">{fmtDate(r.date)}</span>, raw: (r) => fmtDate(r.date) },
    { title: "Описание работы", render: (r) => <span className="text-slate-200">{r.description}</span>, raw: (r) => r.description },
    { title: "Стоимость", align: "r", render: (r) => <span className="tnum font-semibold text-sky2">{fmtNum(r.cost)}</span>, raw: (r) => fmtNum(r.cost) },
    {
      title: "",
      align: "c",
      render: (r) => (
        <div className="flex justify-center gap-1">
          <IconBtn icon={Pencil} title="Изменить" tone="orange" onClick={() => setEditW(r)} />
          <IconBtn icon={Trash2} title="Удалить" tone="danger" onClick={() => setConfirmW(r.id)} />
        </div>
      ),
    },
  ];

  const colsP: Col<CarPart>[] = [
    { title: "Дата", render: (r) => <span className="tnum text-muted">{fmtDate(r.date)}</span>, raw: (r) => fmtDate(r.date) },
    { title: "Артикул", align: "c", render: (r) => <span className="tnum text-muted">{r.artikul || "—"}</span>, raw: (r) => r.artikul },
    { title: "Название", render: (r) => <span className="text-slate-200">{r.partName}</span>, raw: (r) => r.partName },
    { title: "Кол-во", align: "c", render: (r) => <span className="tnum">{r.quantity}</span>, raw: (r) => String(r.quantity) },
    { title: "Цена", align: "r", render: (r) => <span className="tnum">{fmtNum(r.price)}</span>, raw: (r) => fmtNum(r.price) },
    { title: "Сумма", align: "r", render: (r) => <span className="tnum font-semibold text-brand2">{fmtNum(r.quantity * r.price)}</span>, raw: (r) => fmtNum(r.quantity * r.price) },
    {
      title: "",
      align: "c",
      render: (r) => (
        <div className="flex justify-center gap-1">
          <IconBtn icon={Pencil} title="Изменить" tone="orange" onClick={() => setEditP(r)} />
          <IconBtn icon={Trash2} title="Удалить" tone="danger" onClick={() => setConfirmP(r.id)} />
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={!!carId && !!car}
        onClose={onClose}
        title={car ? `${car.mark}${car.number && car.number !== "—" ? ` · ${car.number}` : ""}` : ""}
        subtitle={car?.owner ? `Владелец: ${car.owner}` : "Журнал автомобиля"}
        wide
        noPad
      >
        <div className="border-b border-line bg-panel2/50 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sky">Работы: {fmtMoney(wTotal)}</Badge>
            <Badge tone="orange">Запчасти: {fmtMoney(pTotal)}</Badge>
            <Badge tone="mint">Всего: {fmtMoney(wTotal + pTotal)}</Badge>
            <div className="ml-auto flex items-center gap-2">
              <Segmented
                options={[
                  {
                    id: "works" as const,
                    label: (
                      <>
                        <Wrench size={13} /> Работы · {works.length}
                      </>
                    ),
                  },
                  {
                    id: "parts" as const,
                    label: (
                      <>
                        <Cog size={13} /> Запчасти · {parts.length}
                      </>
                    ),
                  },
                ]}
                value={tab}
                onChange={(v) => setTab(v)}
              />
              <Button
                variant="sky"
                size="sm"
                icon={Printer}
                onClick={() => {
                  if (car) {
                    const ok = printCarJournal(car, works, parts);
                    if (!ok) toast.error("Браузер заблокировал окно печати");
                  }
                }}
              >
                Печать
              </Button>
            </div>
          </div>
        </div>

        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tab === "works" ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="p-5"
        >
          {tab === "works" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-end gap-3 rounded-xl border border-line bg-panel2/60 p-3.5 md:grid-cols-[150px_1fr_160px_auto]">
                <Field label="Дата">
                  <Input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} />
                </Field>
                <Field label="Описание работы" className="col-span-2 md:col-span-1">
                  <Input
                    value={wDesc}
                    onChange={(e) => setWDesc(e.target.value)}
                    placeholder="Замена масла, диагностика…"
                    onKeyDown={(e) => e.key === "Enter" && submitWork()}
                  />
                </Field>
                <Field label="Стоимость">
                  <Input
                    inputMode="decimal"
                    value={wCost}
                    onChange={(e) => setWCost(e.target.value)}
                    placeholder="0.00"
                    onKeyDown={(e) => e.key === "Enter" && submitWork()}
                  />
                </Field>
                <Button variant="success" icon={Plus} onClick={submitWork} className="col-span-2 md:col-span-1">
                  Добавить
                </Button>
              </div>
              <DataTable
                cols={colsW}
                rows={works}
                rowKey={(r) => r.id}
                empty={{ title: "Работ по этому авто пока нет" }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-end gap-3 rounded-xl border border-line bg-panel2/60 p-3.5 md:grid-cols-4 xl:grid-cols-[150px_150px_1fr_90px_140px_auto]">
                <Field label="Дата">
                  <Input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} />
                </Field>
                <Field label="Артикул" hint="поиск по складу">
                  <Input value={pArt} onChange={(e) => onArtikul(e.target.value)} placeholder="MO-5404" />
                </Field>
                <Field label="Название запчасти" className="col-span-2 xl:col-span-1">
                  <Input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Масло 5W-40" />
                </Field>
                <Field label="Кол-во">
                  <Input inputMode="numeric" value={pQty} onChange={(e) => setPQty(e.target.value)} />
                </Field>
                <Field label="Цена за шт." hint={`сумма: ${fmtMoney(partSum)}`}>
                  <Input inputMode="decimal" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="0.00" />
                </Field>
                <Button variant="success" icon={Plus} onClick={submitPart} className="col-span-2 md:col-span-4 xl:col-span-1">
                  Добавить
                </Button>
              </div>
              <p className="text-[11px] leading-relaxed text-faint">
                Если указан артикул со склада — остаток спишется автоматически, а продажа попадёт в отчёты.
              </p>
              <DataTable
                cols={colsP}
                rows={parts}
                rowKey={(r) => r.id}
                empty={{ title: "Запчастей по этому авто пока нет" }}
              />
            </div>
          )}
        </motion.div>
      </Modal>

      {/* редактирование работы */}
      <Modal open={!!editW} onClose={() => setEditW(null)} title="Редактировать работу" subtitle={editW?.description}>
        {editW && (
          <EditWorkForm
            initial={editW}
            onCancel={() => setEditW(null)}
            onSave={(v) => {
              updateCarWork(editW.id, v);
              toast.success("Работа обновлена");
              setEditW(null);
            }}
          />
        )}
      </Modal>

      {/* редактирование запчасти */}
      <Modal open={!!editP} onClose={() => setEditP(null)} title="Редактировать запчасть" subtitle={editP?.partName}>
        {editP && (
          <EditPartForm
            initial={editP}
            onCancel={() => setEditP(null)}
            onSave={(v) => {
              updateCarPart(editP.id, v);
              toast.success("Запчасть обновлена");
              setEditP(null);
            }}
          />
        )}
      </Modal>

      <ConfirmModal
        open={confirmW !== null}
        onClose={() => setConfirmW(null)}
        onConfirm={() => {
          if (confirmW) deleteCarWork(confirmW);
          toast.success("Работа удалена");
        }}
        title="Удалить работу?"
        message="Запись о работе будет удалена из журнала автомобиля."
      />
      <ConfirmModal
        open={confirmP !== null}
        onClose={() => setConfirmP(null)}
        onConfirm={() => {
          if (confirmP) deleteCarPart(confirmP);
          toast.success("Запчасть удалена");
        }}
        title="Удалить запчасть?"
        message="Запись будет удалена из журнала. Остаток на складе автоматически не возвращается."
      />
    </>
  );
}

function EditWorkForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: CarWork;
  onCancel: () => void;
  onSave: (v: { date: string; description: string; cost: number }) => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState(initial.date);
  const [desc, setDesc] = useState(initial.description);
  const [cost, setCost] = useState(String(initial.cost));
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Дата">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Стоимость">
          <Input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Описание" className="col-span-2">
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onCancel}>Отмена</Button>
        <Button
          variant="primary"
          onClick={() => {
            const c = parseNum(cost);
            if (!desc.trim()) return toast.error("Введите описание");
            if (!isISO(date)) return toast.error("Укажите дату");
            onSave({ date, description: desc.trim(), cost: Number.isFinite(c) ? c : 0 });
          }}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
}

function EditPartForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: CarPart;
  onCancel: () => void;
  onSave: (v: { date: string; partName: string; artikul: string; quantity: number; price: number }) => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState(initial.date);
  const [art, setArt] = useState(initial.artikul);
  const [name, setName] = useState(initial.partName);
  const [qty, setQty] = useState(String(initial.quantity));
  const [price, setPrice] = useState(String(initial.price));
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Дата">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Артикул">
          <Input value={art} onChange={(e) => setArt(e.target.value)} />
        </Field>
        <Field label="Название" className="col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Кол-во">
          <Input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label="Цена за шт.">
          <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onCancel}>Отмена</Button>
        <Button
          variant="primary"
          onClick={() => {
            const q = parseInt(qty, 10);
            const p = parseNum(price);
            if (!name.trim()) return toast.error("Введите название");
            if (!Number.isInteger(q) || q <= 0) return toast.error("Некорректное количество");
            onSave({
              date,
              partName: name.trim(),
              artikul: art.trim(),
              quantity: q,
              price: Number.isFinite(p) ? p : 0,
            });
          }}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
}
