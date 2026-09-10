import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, Trash2, UserRound, Wrench } from "lucide-react";
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
  Modal,
} from "../components/ui";
import { fmtDate, fmtMoney, fmtNum, isISO, parseNum, todayISO } from "../lib/utils";
import type { Work } from "../lib/types";

export default function Works() {
  const { state, addWorker, addWork, updateWork, deleteWork } = useStore();
  const toast = useToast();

  const [activeWorker, setActiveWorker] = useState<string | null>(
    state.workers[0]?.id ?? null
  );
  const worker = state.workers.find((w) => w.id === activeWorker) ?? state.workers[0];
  const wid = worker?.id ?? null;

  const [date, setDate] = useState(todayISO());
  const [car, setCar] = useState("");
  const [workText, setWorkText] = useState("");
  const [cost, setCost] = useState("");

  const [editing, setEditing] = useState<Work | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [addWorkerOpen, setAddWorkerOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");

  const rows = useMemo(
    () =>
      state.works
        .filter((w) => w.workerId === wid)
        .sort((a, b) => (a.date === b.date ? b.ts - a.ts : b.date.localeCompare(a.date))),
    [state.works, wid]
  );

  const sums = useMemo(() => {
    const t = todayISO();
    return {
      total: rows.reduce((a, w) => a + w.cost, 0),
      today: rows.filter((w) => w.date === t).reduce((a, w) => a + w.cost, 0),
    };
  }, [rows]);

  const submit = () => {
    if (!wid) return;
    const c = parseNum(cost);
    if (!car.trim() || !workText.trim()) return toast.error("Заполните автомобиль и работу");
    if (!isISO(date)) return toast.error("Укажите дату");
    if (!Number.isFinite(c) || c < 0) return toast.error("Некорректная стоимость");
    addWork({ workerId: wid, date, car: car.trim(), work: workText.trim(), cost: c });
    toast.success(`Работа добавлена: ${workText.trim()} · ${fmtMoney(c)}`);
    setCar("");
    setWorkText("");
    setCost("");
    setDate(todayISO());
  };

  const cols: Col<Work>[] = [
    { title: "Дата", render: (r) => <span className="tnum text-muted">{fmtDate(r.date)}</span>, raw: (r) => fmtDate(r.date) },
    { title: "Автомобиль", render: (r) => <span className="font-medium text-slate-100">{r.car}</span>, raw: (r) => r.car },
    { title: "Работа", render: (r) => <span className="text-slate-300">{r.work}</span>, raw: (r) => r.work },
    { title: "Стоимость", align: "r", render: (r) => <span className="tnum font-semibold text-sky2">{fmtNum(r.cost)}</span>, raw: (r) => fmtNum(r.cost) },
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
      {/* мастера */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-wrap items-center gap-2">
        {state.workers.map((w) => {
          const active = w.id === wid;
          const sum = state.works.filter((x) => x.workerId === w.id).reduce((a, x) => a + x.cost, 0);
          return (
            <button
              key={w.id}
              onClick={() => setActiveWorker(w.id)}
              className={
                "group flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition " +
                (active
                  ? "border-brand/50 bg-brand/12 shadow-lg shadow-brand/10"
                  : "border-line bg-panel hover:border-line2")
              }
            >
              <span
                className={
                  "flex h-8 w-8 items-center justify-center rounded-full border font-display text-[13px] font-bold " +
                  (active ? "border-brand/40 bg-brand/20 text-brand2" : "border-line2 bg-panel3 text-muted")
                }
              >
                {w.name.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <span className={"block text-[13px] font-bold " + (active ? "text-white" : "text-slate-200")}>
                  {w.name}
                </span>
                <span className="tnum block text-[10px] font-semibold text-faint">
                  всего {fmtMoney(sum)}
                </span>
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setAddWorkerOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-line2 px-4 py-2.5 text-[13px] font-semibold text-faint transition hover:border-brand/40 hover:text-brand2"
        >
          <Plus size={15} />
          Мастер
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={wid ?? "none"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {worker && (
            <>
              <Card>
                <CardHead
                  icon={Wrench}
                  title={`Добавить работу — ${worker.name}`}
                  hint={`Сегодня ${fmtMoney(sums.today)} · всего ${fmtMoney(sums.total)}`}
                />
                <div className="grid grid-cols-2 items-end gap-3 p-5 md:grid-cols-4 xl:grid-cols-[160px_1fr_2fr_200px_auto]">
                  <Field label="Дата">
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </Field>
                  <Field label="Автомобиль" className="col-span-2 md:col-span-1">
                    <Input value={car} onChange={(e) => setCar(e.target.value)} placeholder="Toyota Camry" />
                  </Field>
                  <Field label="Работа" className="col-span-2 md:col-span-1">
                    <Input
                      value={workText}
                      onChange={(e) => setWorkText(e.target.value)}
                      placeholder="Замена колодок"
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                    />
                  </Field>
                  <Field label="Стоимость">
                    <Input
                      inputMode="decimal"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                    />
                  </Field>
                  <Button variant="success" icon={Plus} onClick={submit} className="col-span-2 md:col-span-4 xl:col-span-1">
                    Добавить
                  </Button>
                </div>
              </Card>

              <Card>
                <CardHead
                  icon={UserRound}
                  tone="sky"
                  title={`Журнал работ — ${worker.name}`}
                  hint={`${rows.length} записей · на сумму ${fmtMoney(sums.total)}`}
                />
                <DataTable
                  cols={cols}
                  rows={rows}
                  rowKey={(r) => r.id}
                  empty={{ title: "Работ пока нет", hint: "Добавьте первую работу через форму выше" }}
                />
              </Card>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* добавить мастера */}
      <Modal open={addWorkerOpen} onClose={() => setAddWorkerOpen(false)} title="Новый мастер">
        <Field label="Имя мастера">
          <Input
            autoFocus
            value={newWorkerName}
            onChange={(e) => setNewWorkerName(e.target.value)}
            placeholder="Например: Дима"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newWorkerName.trim()) {
                addWorker(newWorkerName.trim());
                setNewWorkerName("");
                setAddWorkerOpen(false);
                toast.success("Мастер добавлен");
              }
            }}
          />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setAddWorkerOpen(false)}>Отмена</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!newWorkerName.trim()) return;
              addWorker(newWorkerName.trim());
              setNewWorkerName("");
              setAddWorkerOpen(false);
              toast.success("Мастер добавлен");
            }}
          >
            Добавить
          </Button>
        </div>
      </Modal>

      {/* редактирование работы */}
      <EditWorkModal work={editing} onClose={() => setEditing(null)} onSave={updateWork} />

      <ConfirmModal
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) deleteWork(confirmId);
          toast.success("Запись о работе удалена");
        }}
        title="Удалить работу?"
        message="Запись о выполненной работе будет удалена без возврата средств в отчёты других периодов."
      />
    </div>
  );
}

function EditWorkModal({
  work,
  onClose,
  onSave,
}: {
  work: Work | null;
  onClose: () => void;
  onSave: (id: string, inp: { date: string; car: string; work: string; cost: number }) => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState("");
  const [car, setCar] = useState("");
  const [text, setText] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => {
    if (work) {
      setDate(work.date);
      setCar(work.car);
      setText(work.work);
      setCost(String(work.cost));
    }
  }, [work]);

  const save = () => {
    if (!work) return;
    const c = parseNum(cost);
    if (!car.trim() || !text.trim()) return toast.error("Заполните все поля");
    if (!isISO(date)) return toast.error("Укажите дату");
    if (!Number.isFinite(c) || c < 0) return toast.error("Некорректная стоимость");
    onSave(work.id, { date, car: car.trim(), work: text.trim(), cost: c });
    toast.success("Работа обновлена");
    onClose();
  };

  return (
    <Modal open={!!work} onClose={onClose} title="Редактировать работу" subtitle={work?.work}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Дата">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Стоимость">
          <Input inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Автомобиль" className="col-span-2">
          <Input value={car} onChange={(e) => setCar(e.target.value)} />
        </Field>
        <Field label="Работа" className="col-span-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} />
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
