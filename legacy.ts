/*
 * Конвертер старой базы SQLite (avtomasterskaya.db от Python-программы)
 * в формат данных веб-приложения. Читает файл прямо в браузере через
 * sql.js (SQLite, скомпилированный в WebAssembly).
 */
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import type { ShopState } from "./types";
import { genId, todayISO } from "./utils";

export interface LegacyStats {
  label: string;
  count: number;
}

export interface LegacyResult {
  state: ShopState;
  stats: LegacyStats[];
}

const num = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v).trim();

/* Даты в старой базе хранятся как ISO "YYYY-MM-DD", но подстрахуемся */
const normDate = (v: unknown): string => {
  const s = str(v);
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ru = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(s);
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
  return todayISO();
};

export async function parseLegacyDb(buffer: ArrayBuffer): Promise<LegacyResult> {
  /* проверяем сигнатуру файла */
  const head = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 15)));
  if (!head.startsWith("SQLite format 3")) {
    throw new Error("not-sqlite");
  }

  const { default: initSqlJs } = await import("sql.js");
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const db = new SQL.Database(new Uint8Array(buffer));

  try {
    /* читаем таблицу целиком, опираясь на реально существующие колонки —
       так переживаем любые версии старой схемы (без artikul / firm_id и т.п.) */
    const rows = (table: string): Record<string, unknown>[] => {
      try {
        const info = db.exec(`PRAGMA table_info("${table}")`);
        if (!info.length || !info[0].values.length) return [];
        const cols = info[0].values.map((v) => String(v[1]));
        const res = db.exec(
          `SELECT ${cols.map((c) => `"${c}"`).join(",")} FROM "${table}"`
        );
        if (!res.length) return [];
        return res[0].values.map((r) =>
          Object.fromEntries(r.map((v, i) => [cols[i], v])) as Record<string, unknown>
        );
      } catch {
        return [];
      }
    };

    /* ── фирмы ── */
    const firmMap = new Map<number, string>();
    const firms = rows("firms").map((r) => {
      const id = genId();
      firmMap.set(num(r.id), id);
      return { id, name: str(r.name) || "Без названия" };
    });
    const firmOf = (v: unknown) => firmMap.get(num(v, -1)) ?? null;

    /* ── запчасти ── */
    const parts = rows("zapchasti").map((r) => ({
      id: genId(),
      name: str(r.name),
      artikul: str(r.artikul),
      firmId: firmOf(r.firm_id),
      quantity: num(r.quantity),
      buyPrice: num(r.buy_price),
      sellPrice: num(r.sell_price),
      createdAt: todayISO(),
    }));

    const base = Date.now();

    /* ── поступления ── */
    const arrivals = rows("postupleniya").map((r, i) => ({
      id: genId(),
      ts: base + i,
      date: normDate(r.date),
      name: str(r.name),
      artikul: str(r.artikul),
      quantity: num(r.quantity),
      buyPrice: num(r.buy_price),
      sellPrice: num(r.sell_price),
      firmId: firmOf(r.firm_id),
    }));

    /* ── продажи ── */
    const sales = rows("prodazhi").map((r, i) => {
      const qty = num(r.quantity, 1) || 1;
      const sell = num(r.sell_price);
      const profit = num(r.profit);
      return {
        id: genId(),
        ts: base + i,
        date: normDate(r.date),
        partId: null,
        partName: str(r.part_name),
        quantity: qty,
        sellPrice: sell,
        buyPrice: Math.round((sell - profit / qty) * 100) / 100,
        total: num(r.total, sell * qty),
        profit,
      };
    });

    /* ── мастера и работы ── */
    const workerMap = new Map<number, string>();
    const workers = rows("workers").map((r) => {
      const id = genId();
      workerMap.set(num(r.id), id);
      return { id, name: str(r.name) || "Мастер" };
    });

    const works = rows("works").map((r, i) => ({
      id: genId(),
      ts: base + i,
      workerId: workerMap.get(num(r.worker_id, -1)) ?? workers[0]?.id ?? "",
      date: normDate(r.date),
      car: str(r.car),
      work: str(r.work),
      cost: num(r.cost),
    })).filter((w) => w.workerId !== "");

    /* ── автомобили и их журналы ── */
    const carMap = new Map<number, string>();
    const cars = rows("cars").map((r, i) => {
      const id = genId();
      carMap.set(num(r.id), id);
      return {
        id,
        ts: base + i,
        mark: str(r.mark) || "Автомобиль",
        number: str(r.number),
        owner: str(r.owner),
        created: normDate(r.created),
      };
    });

    const carWorks = rows("car_works").map((r, i) => ({
      id: genId(),
      ts: base + i,
      carId: carMap.get(num(r.car_id, -1)) ?? "",
      date: normDate(r.date),
      description: str(r.description),
      cost: num(r.cost),
    })).filter((w) => w.carId !== "");

    const carParts = rows("car_parts").map((r, i) => ({
      id: genId(),
      ts: base + i,
      carId: carMap.get(num(r.car_id, -1)) ?? "",
      date: normDate(r.date),
      partName: str(r.part_name),
      artikul: str(r.artikul),
      quantity: num(r.quantity, 1),
      price: num(r.price),
    })).filter((p) => p.carId !== "");

    const state: ShopState = {
      firms,
      parts,
      arrivals,
      sales,
      workers,
      works,
      cars,
      carWorks,
      carParts,
    };

    const stats: LegacyStats[] = [
      { label: "Фирмы", count: firms.length },
      { label: "Запчасти на складе", count: parts.length },
      { label: "Поступления", count: arrivals.length },
      { label: "Продажи", count: sales.length },
      { label: "Мастера", count: workers.length },
      { label: "Работы мастеров", count: works.length },
      { label: "Автомобили", count: cars.length },
      { label: "Записи авто-журнала", count: carWorks.length + carParts.length },
    ];

    return { state, stats };
  } finally {
    db.close();
  }
}
