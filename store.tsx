import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Arrival,
  CarPart,
  CarT,
  CarWork,
  Firm,
  Part,
  Sale,
  ShopState,
  Work,
  WorkerT,
} from "./lib/types";
import { daysAgoISO, genId, round2, todayISO } from "./lib/utils";

const KEY = "avtomaster-store-v1";

/* ─────────────────────────── Seed data ─────────────────────────── */

function seedState(): ShopState {
  const now = Date.now();
  let seq = 0;
  const ts = () => now - (1000 - seq++);

  const firm = (name: string): Firm => ({ id: genId(), name });
  const firms = [
    firm("Bosch"),
    firm("Febi Bilstein"),
    firm("Lynx Auto"),
    firm("Patron"),
    firm("Trialli"),
  ];
  const [fBosch, fFebi, fLynx, fPatron, fTrialli] = firms;

  const part = (
    name: string,
    artikul: string,
    firmId: string | null,
    quantity: number,
    buyPrice: number,
    sellPrice: number
  ): Part => ({
    id: genId(),
    name,
    artikul,
    firmId,
    quantity,
    buyPrice,
    sellPrice,
    createdAt: daysAgoISO(24),
  });

  const parts: Part[] = [
    part("Фильтр масляный", "OF-2101", fBosch.id, 14, 180, 260),
    part("Фильтр воздушный", "AF-3302", fFebi.id, 9, 320, 460),
    part("Свеча зажигания NGK", "SP-0240", fBosch.id, 32, 150, 230),
    part("Колодки тормозные передние", "BP-1180", fLynx.id, 6, 1450, 2100),
    part("Диск тормозной передний", "BD-4501", fPatron.id, 4, 2100, 3050),
    part("Аккумулятор 60 Ач", "AK-6001", fTrialli.id, 3, 4200, 5900),
    part("Ремень ГРМ", "GR-7788", fBosch.id, 7, 890, 1290),
    part("Стойка стабилизатора", "SS-9920", fFebi.id, 2, 640, 950),
    part("Масло моторное 5W-40, 4 л", "MO-5404", fLynx.id, 11, 1750, 2450),
    part("Лампа H7 12V", "LH-7129", fPatron.id, 25, 190, 290),
  ];
  const P = Object.fromEntries(parts.map((p) => [p.artikul, p]));

  const arrival = (
    daysAgo: number,
    name: string,
    artikul: string,
    quantity: number,
    buyPrice: number,
    sellPrice: number,
    firmId: string | null
  ): Arrival => ({
    id: genId(),
    ts: ts(),
    date: daysAgoISO(daysAgo),
    name,
    artikul,
    quantity,
    buyPrice,
    sellPrice,
    firmId,
  });

  const arrivals: Arrival[] = [
    arrival(20, "Фильтр масляный", "OF-2101", 10, 180, 260, fBosch.id),
    arrival(20, "Свеча зажигания NGK", "SP-0240", 20, 150, 230, fBosch.id),
    arrival(18, "Колодки тормозные передние", "BP-1180", 6, 1450, 2100, fLynx.id),
    arrival(15, "Масло моторное 5W-40, 4 л", "MO-5404", 8, 1750, 2450, fLynx.id),
    arrival(12, "Лампа H7 12V", "LH-7129", 25, 190, 290, fPatron.id),
    arrival(9, "Аккумулятор 60 Ач", "AK-6001", 3, 4200, 5900, fTrialli.id),
    arrival(6, "Ремень ГРМ", "GR-7788", 7, 890, 1290, fBosch.id),
    arrival(3, "Фильтр воздушный", "AF-3302", 9, 320, 460, fFebi.id),
    arrival(1, "Диск тормозной передний", "BD-4501", 4, 2100, 3050, fPatron.id),
    arrival(0, "Свеча зажигания NGK", "SP-0240", 12, 150, 230, fBosch.id),
  ];

  const sale = (
    daysAgo: number,
    p: Part,
    quantity: number
  ): Sale => ({
    id: genId(),
    ts: ts(),
    date: daysAgoISO(daysAgo),
    partId: p.id,
    partName: p.name,
    quantity,
    sellPrice: p.sellPrice,
    buyPrice: p.buyPrice,
    total: round2(quantity * p.sellPrice),
    profit: round2(quantity * (p.sellPrice - p.buyPrice)),
  });

  const sales: Sale[] = [
    sale(13, P["OF-2101"], 2),
    sale(13, P["SP-0240"], 4),
    sale(12, P["MO-5404"], 1),
    sale(11, P["LH-7129"], 3),
    sale(10, P["AF-3302"], 1),
    sale(9, P["SP-0240"], 4),
    sale(8, P["BP-1180"], 1),
    sale(7, P["MO-5404"], 2),
    sale(6, P["OF-2101"], 2),
    sale(5, P["GR-7788"], 1),
    sale(4, P["LH-7129"], 2),
    sale(3, P["AK-6001"], 1),
    sale(2, P["MO-5404"], 2),
    sale(2, P["SP-0240"], 4),
    sale(1, P["BD-4501"], 2),
    sale(1, P["OF-2101"], 1),
    sale(0, P["LH-7129"], 2),
    sale(0, P["MO-5404"], 1),
  ];

  const workers: WorkerT[] = [
    { id: genId(), name: "Валера" },
    { id: genId(), name: "Вова" },
  ];
  const [wValera, wVova] = workers;

  const work = (
    daysAgo: number,
    workerId: string,
    car: string,
    workText: string,
    cost: number
  ): Work => ({
    id: genId(),
    ts: ts(),
    workerId,
    date: daysAgoISO(daysAgo),
    car,
    work: workText,
    cost,
  });

  const works: Work[] = [
    work(12, wValera.id, "Lada Vesta", "Замена масла ДВС и фильтра", 1500),
    work(11, wVova.id, "Kia Rio", "Диагностика подвески", 800),
    work(9, wValera.id, "Toyota Camry", "Замена тормозных колодок", 2200),
    work(8, wVova.id, "Renault Logan", "Развал-схождение", 1800),
    work(6, wValera.id, "Kia Rio", "Замена ремня ГРМ с роликами", 4500),
    work(4, wVova.id, "Lada Vesta", "Замена стойки стабилизатора", 1200),
    work(2, wValera.id, "Toyota Camry", "Шиномонтаж, балансировка", 1600),
    work(1, wVova.id, "Renault Logan", "Замена аккумулятора", 500),
    work(0, wValera.id, "Kia Rio", "Диагностика двигателя", 1200),
    work(0, wVova.id, "Lada Vesta", "Замена ламп ближнего света", 600),
  ];

  const car = (
    mark: string,
    number: string,
    owner: string,
    daysAgo: number
  ): CarT => ({
    id: genId(),
    mark,
    number,
    owner,
    created: daysAgoISO(daysAgo),
    ts: ts(),
  });

  const cars: CarT[] = [
    car("Lada Vesta", "А 123 БВ 77", "Игорь С.", 21),
    car("Kia Rio", "М 456 ОР 77", "Светлана К.", 18),
    car("Toyota Camry", "Е 789 КХ 77", "Дмитрий В.", 14),
    car("Renault Logan", "К 321 СТ 77", "Андрей П.", 9),
  ];
  const [cVesta, cRio, cCamry, cLogan] = cars;

  const cw = (
    daysAgo: number,
    carId: string,
    description: string,
    cost: number
  ): CarWork => ({
    id: genId(),
    ts: ts(),
    carId,
    date: daysAgoISO(daysAgo),
    description,
    cost,
  });

  const carWorks: CarWork[] = [
    cw(12, cVesta.id, "Замена масла ДВС и фильтра", 1500),
    cw(4, cVesta.id, "Замена стойки стабилизатора", 1200),
    cw(0, cVesta.id, "Замена ламп ближнего света", 600),
    cw(11, cRio.id, "Диагностика подвески", 800),
    cw(6, cRio.id, "Замена ремня ГРМ с роликами", 4500),
    cw(0, cRio.id, "Диагностика двигателя", 1200),
    cw(9, cCamry.id, "Замена тормозных колодок", 2200),
    cw(2, cCamry.id, "Шиномонтаж, балансировка", 1600),
    cw(8, cLogan.id, "Развал-схождение", 1800),
    cw(1, cLogan.id, "Замена аккумулятора", 500),
  ];

  const cp = (
    daysAgo: number,
    carId: string,
    partName: string,
    artikul: string,
    quantity: number,
    price: number
  ): CarPart => ({
    id: genId(),
    ts: ts(),
    carId,
    date: daysAgoISO(daysAgo),
    partName,
    artikul,
    quantity,
    price,
  });

  const carParts: CarPart[] = [
    cp(12, cVesta.id, "Масло моторное 5W-40, 4 л", "MO-5404", 1, 2450),
    cp(12, cVesta.id, "Фильтр масляный", "OF-2101", 1, 260),
    cp(0, cVesta.id, "Лампа H7 12V", "LH-7129", 2, 290),
    cp(6, cRio.id, "Ремень ГРМ", "GR-7788", 1, 1290),
    cp(9, cCamry.id, "Колодки тормозные передние", "BP-1180", 1, 2100),
    cp(1, cLogan.id, "Аккумулятор 60 Ач", "AK-6001", 1, 5900),
  ];

  return {
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
}

/* ─────────────────────────── Store ─────────────────────────── */

export interface Result {
  ok: boolean;
  error?: string;
  warning?: string;
}

interface StoreApi {
  state: ShopState;
  firmName(id: string | null): string;
  addArrival(inp: {
    date: string;
    name: string;
    artikul: string;
    quantity: number;
    buyPrice: number;
    sellPrice: number;
    firmName: string;
  }): Result;
  deleteArrival(id: string): void;
  addPart(inp: {
    name: string;
    artikul: string;
    quantity: number;
    buyPrice: number;
    sellPrice: number;
    firmName: string;
  }): Result;
  updatePart(
    id: string,
    inp: {
      name: string;
      artikul: string;
      quantity: number;
      buyPrice: number;
      sellPrice: number;
      firmName: string;
    }
  ): void;
  deletePart(id: string): void;
  sellPart(name: string, quantity: number): Result;
  deleteSale(id: string): void;
  addWorker(name: string): void;
  addWork(inp: {
    workerId: string;
    date: string;
    car: string;
    work: string;
    cost: number;
  }): void;
  updateWork(
    id: string,
    inp: { date: string; car: string; work: string; cost: number }
  ): void;
  deleteWork(id: string): void;
  addCar(inp: { mark: string; number: string; owner: string }): void;
  updateCar(id: string, inp: { mark: string; number: string; owner: string }): void;
  deleteCar(id: string): void;
  addCarWork(inp: {
    carId: string;
    date: string;
    description: string;
    cost: number;
  }): void;
  updateCarWork(
    id: string,
    inp: { date: string; description: string; cost: number }
  ): void;
  deleteCarWork(id: string): void;
  addCarPart(inp: {
    carId: string;
    date: string;
    partName: string;
    artikul: string;
    quantity: number;
    price: number;
  }): Result;
  updateCarPart(
    id: string,
    inp: {
      date: string;
      partName: string;
      artikul: string;
      quantity: number;
      price: number;
    }
  ): void;
  deleteCarPart(id: string): void;
  importData(raw: unknown): Result;
  resetDemo(): void;
  clearAll(): void;
}

const StoreCtx = createContext<StoreApi | null>(null);

export const useStore = (): StoreApi => {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
};

function loadState(): ShopState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ShopState;
    if (!s || !Array.isArray(s.parts) || !Array.isArray(s.sales)) return null;
    return s;
  } catch {
    return null;
  }
}

/** Вставляет/находит фирму по имени. */
const ensureFirm = (firms: Firm[], name: string): { firms: Firm[]; id: string } => {
  const found = firms.find((f) => f.name.toLowerCase() === name.toLowerCase());
  if (found) return { firms, id: found.id };
  const f: Firm = { id: genId(), name };
  return { firms: [...firms, f], id: f.id };
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShopState>(
    () => loadState() ?? seedState()
  );

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota exceeded — ignore */
    }
  }, [state]);

  const api = useMemo<StoreApi>(() => {
    const s = state;
    const set = (fn: (prev: ShopState) => ShopState) => setState(fn);

    const firmName = (id: string | null) =>
      id ? s.firms.find((f) => f.id === id)?.name ?? "—" : "—";

    const addArrival: StoreApi["addArrival"] = (inp) => {
      set((prev) => {
        let firms = prev.firms;
        let firmId: string | null = null;
        if (inp.firmName.trim()) {
          const r = ensureFirm(firms, inp.firmName.trim());
          firms = r.firms;
          firmId = r.id;
        }
        const arrival: Arrival = {
          id: genId(),
          ts: Date.now(),
          date: inp.date,
          name: inp.name,
          artikul: inp.artikul,
          quantity: inp.quantity,
          buyPrice: inp.buyPrice,
          sellPrice: inp.sellPrice,
          firmId,
        };
        const existing = prev.parts.find(
          (p) =>
            p.name.toLowerCase() === inp.name.toLowerCase() && p.firmId === firmId
        );
        const parts = existing
          ? prev.parts.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    quantity: p.quantity + inp.quantity,
                    buyPrice: inp.buyPrice,
                    sellPrice: inp.sellPrice,
                    artikul: inp.artikul || p.artikul,
                  }
                : p
            )
          : [
              ...prev.parts,
              {
                id: genId(),
                name: inp.name,
                artikul: inp.artikul,
                firmId,
                quantity: inp.quantity,
                buyPrice: inp.buyPrice,
                sellPrice: inp.sellPrice,
                createdAt: todayISO(),
              },
            ];
        return { ...prev, firms, parts, arrivals: [arrival, ...prev.arrivals] };
      });
      return { ok: true };
    };

    const deleteArrival = (id: string) =>
      set((p) => ({ ...p, arrivals: p.arrivals.filter((a) => a.id !== id) }));

    const addPart: StoreApi["addPart"] = (inp) => {
      set((prev) => {
        let firms = prev.firms;
        let firmId: string | null = null;
        if (inp.firmName.trim()) {
          const r = ensureFirm(firms, inp.firmName.trim());
          firms = r.firms;
          firmId = r.id;
        }
        const existing = prev.parts.find(
          (p) =>
            p.name.toLowerCase() === inp.name.toLowerCase() && p.firmId === firmId
        );
        const parts = existing
          ? prev.parts.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    quantity: p.quantity + inp.quantity,
                    buyPrice: inp.buyPrice,
                    sellPrice: inp.sellPrice,
                    artikul: inp.artikul || p.artikul,
                  }
                : p
            )
          : [
              ...prev.parts,
              {
                id: genId(),
                name: inp.name,
                artikul: inp.artikul,
                firmId,
                quantity: inp.quantity,
                buyPrice: inp.buyPrice,
                sellPrice: inp.sellPrice,
                createdAt: todayISO(),
              },
            ];
        return { ...prev, firms, parts };
      });
      return { ok: true };
    };

    const updatePart: StoreApi["updatePart"] = (id, inp) => {
      set((prev) => {
        let firms = prev.firms;
        let firmId: string | null = null;
        if (inp.firmName.trim()) {
          const r = ensureFirm(firms, inp.firmName.trim());
          firms = r.firms;
          firmId = r.id;
        }
        return {
          ...prev,
          firms,
          parts: prev.parts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: inp.name,
                  artikul: inp.artikul,
                  firmId,
                  quantity: inp.quantity,
                  buyPrice: inp.buyPrice,
                  sellPrice: inp.sellPrice,
                }
              : p
          ),
        };
      });
    };

    const deletePart = (id: string) =>
      set((p) => ({ ...p, parts: p.parts.filter((x) => x.id !== id) }));

    const sellPart: StoreApi["sellPart"] = (name, quantity) => {
      const target = s.parts.find(
        (p) => p.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (!target) return { ok: false, error: "Запчасть не найдена на складе" };
      if (quantity > target.quantity)
        return { ok: false, error: `На складе только ${target.quantity} шт.` };
      const sale: Sale = {
        id: genId(),
        ts: Date.now(),
        date: todayISO(),
        partId: target.id,
        partName: target.name,
        quantity,
        sellPrice: target.sellPrice,
        buyPrice: target.buyPrice,
        total: round2(quantity * target.sellPrice),
        profit: round2(quantity * (target.sellPrice - target.buyPrice)),
      };
      set((prev) => ({
        ...prev,
        parts: prev.parts.map((p) =>
          p.id === target.id ? { ...p, quantity: p.quantity - quantity } : p
        ),
        sales: [sale, ...prev.sales],
      }));
      return { ok: true };
    };

    const deleteSale = (id: string) =>
      set((prev) => {
        const sale = prev.sales.find((x) => x.id === id);
        if (!sale) return prev;
        const part = prev.parts.find(
          (p) => p.name.toLowerCase() === sale.partName.toLowerCase()
        );
        return {
          ...prev,
          sales: prev.sales.filter((x) => x.id !== id),
          parts: part
            ? prev.parts.map((p) =>
                p.id === part.id
                  ? { ...p, quantity: p.quantity + sale.quantity }
                  : p
              )
            : prev.parts,
        };
      });

    const addWorker = (name: string) =>
      set((p) => ({ ...p, workers: [...p.workers, { id: genId(), name }] }));

    const addWork: StoreApi["addWork"] = (inp) =>
      set((p) => ({
        ...p,
        works: [{ id: genId(), ts: Date.now(), ...inp }, ...p.works],
      }));

    const updateWork: StoreApi["updateWork"] = (id, inp) =>
      set((p) => ({
        ...p,
        works: p.works.map((w) => (w.id === id ? { ...w, ...inp } : w)),
      }));

    const deleteWork = (id: string) =>
      set((p) => ({ ...p, works: p.works.filter((w) => w.id !== id) }));

    const addCar: StoreApi["addCar"] = (inp) =>
      set((p) => ({
        ...p,
        cars: [
          {
            id: genId(),
            ts: Date.now(),
            mark: inp.mark,
            number: inp.number,
            owner: inp.owner,
            created: todayISO(),
          },
          ...p.cars,
        ],
      }));

    const updateCar: StoreApi["updateCar"] = (id, inp) =>
      set((p) => ({
        ...p,
        cars: p.cars.map((c) => (c.id === id ? { ...c, ...inp } : c)),
      }));

    const deleteCar = (id: string) =>
      set((p) => ({
        ...p,
        cars: p.cars.filter((c) => c.id !== id),
        carWorks: p.carWorks.filter((w) => w.carId !== id),
        carParts: p.carParts.filter((cp) => cp.carId !== id),
      }));

    const addCarWork: StoreApi["addCarWork"] = (inp) =>
      set((p) => ({
        ...p,
        carWorks: [{ id: genId(), ts: Date.now(), ...inp }, ...p.carWorks],
      }));

    const updateCarWork: StoreApi["updateCarWork"] = (id, inp) =>
      set((p) => ({
        ...p,
        carWorks: p.carWorks.map((w) => (w.id === id ? { ...w, ...inp } : w)),
      }));

    const deleteCarWork = (id: string) =>
      set((p) => ({ ...p, carWorks: p.carWorks.filter((w) => w.id !== id) }));

    const addCarPart: StoreApi["addCarPart"] = (inp) => {
      let warning: string | undefined;
      const stockPart = inp.artikul
        ? s.parts.find(
            (p) => p.artikul.toLowerCase() === inp.artikul.toLowerCase()
          )
        : undefined;
      if (inp.artikul && !stockPart) {
        warning = `Артикул «${inp.artikul}» не найден на складе — запись добавлена, склад не изменён`;
      } else if (stockPart && stockPart.quantity <= 0) {
        warning = `«${stockPart.name}» закончилась на складе — склад не изменён`;
      } else if (stockPart && stockPart.quantity < inp.quantity) {
        warning = `На складе только ${stockPart.quantity} шт. «${stockPart.name}» — списано ${stockPart.quantity} шт.`;
      }
      set((prev) => {
        const deduct = stockPart
          ? Math.min(stockPart.quantity, inp.quantity)
          : 0;
        const sales: Sale[] = [...prev.sales];
        if (stockPart && deduct > 0) {
          sales.unshift({
            id: genId(),
            ts: Date.now(),
            date: todayISO(),
            partId: stockPart.id,
            partName: stockPart.name,
            quantity: deduct,
            sellPrice: stockPart.sellPrice,
            buyPrice: stockPart.buyPrice,
            total: round2(deduct * stockPart.sellPrice),
            profit: round2(deduct * (stockPart.sellPrice - stockPart.buyPrice)),
          });
        }
        return {
          ...prev,
          carParts: [{ id: genId(), ts: Date.now(), ...inp }, ...prev.carParts],
          parts:
            stockPart && deduct > 0
              ? prev.parts.map((p) =>
                  p.id === stockPart.id
                    ? { ...p, quantity: p.quantity - deduct }
                    : p
                )
              : prev.parts,
          sales,
        };
      });
      return { ok: true, warning };
    };

    const updateCarPart: StoreApi["updateCarPart"] = (id, inp) =>
      set((p) => ({
        ...p,
        carParts: p.carParts.map((cp) => (cp.id === id ? { ...cp, ...inp } : cp)),
      }));

    const deleteCarPart = (id: string) =>
      set((p) => ({ ...p, carParts: p.carParts.filter((cp) => cp.id !== id) }));

    const importData: StoreApi["importData"] = (raw) => {
      const d = raw as Partial<ShopState>;
      if (
        !d ||
        !Array.isArray(d.parts) ||
        !Array.isArray(d.sales) ||
        !Array.isArray(d.arrivals)
      ) {
        return { ok: false, error: "Файл не похож на резервную копию" };
      }
      setState({
        firms: d.firms ?? [],
        parts: d.parts,
        arrivals: d.arrivals,
        sales: d.sales,
        workers: d.workers ?? [],
        works: d.works ?? [],
        cars: d.cars ?? [],
        carWorks: d.carWorks ?? [],
        carParts: d.carParts ?? [],
      });
      return { ok: true };
    };

    const resetDemo = () => setState(seedState());

    const clearAll = () =>
      setState({
        firms: [],
        parts: [],
        arrivals: [],
        sales: [],
        workers: [],
        works: [],
        cars: [],
        carWorks: [],
        carParts: [],
      });

    return {
      state: s,
      firmName,
      addArrival,
      deleteArrival,
      addPart,
      updatePart,
      deletePart,
      sellPart,
      deleteSale,
      addWorker,
      addWork,
      updateWork,
      deleteWork,
      addCar,
      updateCar,
      deleteCar,
      addCarWork,
      updateCarWork,
      deleteCarWork,
      addCarPart,
      updateCarPart,
      deleteCarPart,
      importData,
      resetDemo,
      clearAll,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}
