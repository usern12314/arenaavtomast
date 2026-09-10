import { useRef, useState } from "react";
import {
  AlertTriangle,
  DatabaseBackup,
  Download,
  Eraser,
  FileJson,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useStore } from "../store";
import { useToast } from "./Toaster";
import { Badge, Button, ConfirmModal, Modal } from "./ui";
import { downloadFile, todayISO } from "../lib/utils";
import { parseLegacyDb, type LegacyResult } from "../lib/legacy";

export default function DataModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, importData, resetDemo, clearAll } = useStore();
  const toast = useToast();

  const jsonRef = useRef<HTMLInputElement>(null);
  const dbRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDb, setPendingDb] = useState<LegacyResult | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  /* ── JSON ── */
  const exportJSON = () => {
    downloadFile(
      `avtomasterskaya-backup-${todayISO()}.json`,
      JSON.stringify(state, null, 2)
    );
    toast.success("Резервная копия скачана");
  };

  const importJSON = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const r = importData(JSON.parse(String(reader.result)));
        if (r.ok) {
          toast.success("Данные восстановлены из копии");
          onClose();
        } else toast.error(r.error ?? "Ошибка импорта");
      } catch {
        toast.error("Не удалось прочитать файл");
      }
    };
    reader.readAsText(f);
  };

  /* ── старая база .db ── */
  const importDB = async (f: File) => {
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const parsed = await parseLegacyDb(buf);
      setPendingDb(parsed);
    } catch {
      toast.error(
        "Не получилось прочитать файл. Нужен именно avtomasterskaya.db от старой программы."
      );
    } finally {
      setBusy(false);
    }
  };

  const pendingSummary = pendingDb
    ? pendingDb.stats
        .filter((s) => s.count > 0)
        .map((s) => `${s.label}: ${s.count}`)
        .join(" · ")
    : "";

  return (
    <>
      <Modal open={open} onClose={onClose} title="Данные и резервные копии" subtitle="Импорт, экспорт и очистка" wide>
        <div className="space-y-5">
          {/* автосохранение */}
          <div className="flex items-center gap-2 rounded-xl border border-mint/25 bg-mint/[0.06] px-3.5 py-2.5 text-[12px] text-mint">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            Автосохранение включено — каждое изменение записывается мгновенно
          </div>

          {/* резервная копия JSON */}
          <section className="rounded-xl border border-line bg-panel2/50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky2/12 text-sky2">
                <FileJson size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white">Резервная копия (JSON)</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  Скачивайте копию на флешку или в облако и восстанавливайте на любом компьютере.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" icon={Download} onClick={exportJSON}>
                    Скачать копию
                  </Button>
                  <Button size="sm" icon={Upload} onClick={() => jsonRef.current?.click()}>
                    Загрузить из файла
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* импорт старой базы */}
          <section className="rounded-xl border border-brand/30 bg-brand/[0.05] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand2">
                {busy ? <Loader2 size={17} className="animate-spin" /> : <DatabaseBackup size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white">База из старой программы (.db)</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  Файл <b className="text-slate-300">avtomasterskaya.db</b> лежит в папке рядом с
                  прежней программой (exe или .py). Выберите его — склад, продажи, работы, мастера
                  и автомобили перенесутся сюда автоматически.
                </p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="sky"
                    icon={DatabaseBackup}
                    disabled={busy}
                    onClick={() => dbRef.current?.click()}
                  >
                    {busy ? "Читаю базу…" : "Выбрать avtomasterskaya.db"}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* опасная зона */}
          <section className="rounded-xl border border-danger/25 bg-danger/[0.04] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/15 text-danger">
                <AlertTriangle size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#ff9a8a]">Опасная зона</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                  Удаление необратимо — перед этим скачайте резервную копию.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="danger" icon={Eraser} onClick={() => setConfirmClear(true)}>
                    Очистить все данные
                  </Button>
                  <Button size="sm" icon={RotateCcw} onClick={() => setConfirmReset(true)}>
                    Вернуть демо-данные
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-faint">
                  Сейчас в базе: <Badge tone="gray">{state.parts.length} запчастей</Badge>{" "}
                  <Badge tone="gray">{state.sales.length} продаж</Badge>{" "}
                  <Badge tone="gray">{state.cars.length} авто</Badge>
                </p>
              </div>
            </div>
          </section>
        </div>

        <input
          ref={jsonRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJSON(f);
            e.target.value = "";
          }}
        />
        <input
          ref={dbRef}
          type="file"
          accept=".db,application/x-sqlite3,application/octet-stream"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importDB(f);
            e.target.value = "";
          }}
        />
      </Modal>

      {/* подтверждение импорта старой базы */}
      <ConfirmModal
        open={pendingDb !== null}
        onClose={() => setPendingDb(null)}
        onConfirm={() => {
          if (pendingDb) {
            importData(pendingDb.state);
            toast.success("Старая база импортирована — всё на месте");
            setPendingDb(null);
            onClose();
          }
        }}
        title="Импортировать старую базу?"
        message={`Найдено → ${pendingSummary || "пустая база"}. ВНИМАНИЕ: текущие данные (включая демо) будут полностью заменены.`}
        confirmLabel="Импортировать"
      />

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          toast.success("Все данные удалены — начинаем с чистого листа");
          onClose();
        }}
        title="Очистить все данные?"
        message="Будут удалены ВСЕ запчасти, продажи, работы, автомобили и фирмы — и демо-данные, и ваши записи. Действие необратимо."
        confirmLabel="Удалить всё"
      />

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          toast.success("Демо-данные восстановлены");
        }}
        title="Вернуть демо-данные?"
        message="Текущие данные будут заменены демонстрационным набором для знакомства с программой."
        confirmLabel="Сбросить"
      />
    </>
  );
}
