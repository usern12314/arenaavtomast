import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Car as CarIcon, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "../components/Toaster";
import {
  Badge,
  Button,
  Card,
  CardHead,
  ConfirmModal,
  EmptyState,
  Field,
  Input,
  Modal,
  SearchInput,
} from "../components/ui";
import CarJournalModal from "../components/CarJournalModal";
import { fmtDate, fmtInt } from "../lib/utils";
import type { CarT } from "../lib/types";

export default function Cars() {
  const { state, addCar, updateCar, deleteCar } = useStore();
  const toast = useToast();

  const [mark, setMark] = useState("");
  const [number, setNumber] = useState("");
  const [owner, setOwner] = useState("");
  const [search, setSearch] = useState("");
  const [openCarId, setOpenCarId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CarT | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...state.cars].sort((a, b) => b.ts - a.ts);
    if (!q) return list;
    return list.filter(
      (c) =>
        c.mark.toLowerCase().includes(q) ||
        c.number.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q)
    );
  }, [state.cars, search]);

  const counts = (id: string) =>
    state.carWorks.filter((w) => w.carId === id).length +
    state.carParts.filter((p) => p.carId === id).length;

  const totals = (id: string) =>
    state.carWorks.filter((w) => w.carId === id).reduce((a, w) => a + w.cost, 0) +
    state.carParts.filter((p) => p.carId === id).reduce((a, p) => a + p.quantity * p.price, 0);

  const submit = () => {
    if (!mark.trim()) return toast.error("Введите марку автомобиля");
    addCar({ mark: mark.trim(), number: number.trim(), owner: owner.trim() });
    toast.success(`${mark.trim()} добавлен в журнал`);
    setMark("");
    setNumber("");
    setOwner("");
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardHead icon={CarIcon} title="Добавить автомобиль" hint="Двойной источник истины для работ и запчастей по каждой машине" />
          <div className="grid grid-cols-2 items-end gap-3 p-5 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <Field label="Марка / модель" className="col-span-2 md:col-span-1">
              <Input
                value={mark}
                onChange={(e) => setMark(e.target.value)}
                placeholder="Toyota Camry"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </Field>
            <Field label="Гос. номер">
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="А 123 БВ 77" />
            </Field>
            <Field label="Владелец">
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Иван" />
            </Field>
            <Button variant="success" icon={Plus} onClick={submit} className="col-span-2 md:col-span-1">
              Добавить
            </Button>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
        <Card>
          <CardHead
            icon={CarIcon}
            tone="sky"
            title="Автомобили"
            hint={`${rows.length} в журнале · клик по карточке — открыть историю`}
            actions={<SearchInput value={search} onChange={setSearch} placeholder="Марка, номер, владелец…" className="w-60" />}
          />
          {rows.length === 0 ? (
            <EmptyState title="Автомобилей нет" hint="Добавьте первый автомобиль через форму выше" />
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  onClick={() => setOpenCarId(c.id)}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-panel2/60 p-4 text-left transition hover:border-brand/40 hover:bg-panel2"
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/[0.07] blur-xl transition group-hover:bg-brand/[0.14]" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[15px] font-bold text-white">{c.mark}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-faint">
                        <UserRound size={11} />
                        {c.owner || "—"}
                      </p>
                    </div>
                    <div
                      className="flex shrink-0 gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        title="Изменить"
                        onClick={() => setEditing(c)}
                        className="rounded-lg border border-transparent p-1.5 text-faint transition hover:border-brand/40 hover:bg-brand/15 hover:text-brand2"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        title="Удалить"
                        onClick={() => setConfirmId(c.id)}
                        className="rounded-lg border border-transparent p-1.5 text-faint transition hover:border-danger/40 hover:bg-danger/15 hover:text-danger"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {c.number ? (
                    <span className="mt-3 inline-block rounded-md border border-slate-300/80 bg-slate-100 px-2 py-0.5 font-display text-[12px] font-bold tracking-wider text-slate-900">
                      {c.number}
                    </span>
                  ) : (
                    <span className="mt-3 inline-block rounded-md border border-dashed border-line2 px-2 py-0.5 text-[11px] text-faint">
                      без номера
                    </span>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px]">
                    <span className="text-faint">
                      с {fmtDate(c.created)} · {fmtInt(counts(c.id))} записей
                    </span>
                    <Badge tone="mint">{new Intl.NumberFormat("ru-RU").format(Math.round(totals(c.id)))} ₽</Badge>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand2 opacity-0 transition group-hover:opacity-100">
                    Открыть журнал
                    <ArrowUpRight size={12} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      <CarJournalModal carId={openCarId} onClose={() => setOpenCarId(null)} />

      <EditCarModal car={editing} onClose={() => setEditing(null)} onSave={updateCar} />

      <ConfirmModal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) deleteCar(confirmId);
          toast.success("Автомобиль и все его записи удалены");
        }}
        title="Удалить автомобиль?"
        message="Вместе с автомобилем будут удалены все записи журнала: работы и запчасти. Это действие необратимо."
      />
    </div>
  );
}

function EditCarModal({
  car,
  onClose,
  onSave,
}: {
  car: CarT | null;
  onClose: () => void;
  onSave: (id: string, v: { mark: string; number: string; owner: string }) => void;
}) {
  const toast = useToast();
  const [mark, setMark] = useState("");
  const [number, setNumber] = useState("");
  const [owner, setOwner] = useState("");

  useEffect(() => {
    if (car) {
      setMark(car.mark);
      setNumber(car.number);
      setOwner(car.owner);
    }
  }, [car]);

  return (
    <Modal open={!!car} onClose={onClose} title="Изменить автомобиль" subtitle={car?.mark}>
      <div className="space-y-3">
        <Field label="Марка / модель">
          <Input value={mark} onChange={(e) => setMark(e.target.value)} />
        </Field>
        <Field label="Гос. номер">
          <Input value={number} onChange={(e) => setNumber(e.target.value)} />
        </Field>
        <Field label="Владелец">
          <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="primary"
          onClick={() => {
            if (!car) return;
            if (!mark.trim()) return toast.error("Введите марку");
            onSave(car.id, { mark: mark.trim(), number: number.trim(), owner: owner.trim() });
            toast.success("Автомобиль обновлён");
            onClose();
          }}
        >
          Сохранить
        </Button>
      </div>
    </Modal>
  );
}
