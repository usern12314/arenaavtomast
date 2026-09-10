export interface Firm {
  id: string;
  name: string;
}

export interface Part {
  id: string;
  name: string;
  artikul: string;
  firmId: string | null;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  createdAt: string;
}

export interface Arrival {
  id: string;
  ts: number;
  date: string; // ISO yyyy-mm-dd
  name: string;
  artikul: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  firmId: string | null;
}

export interface Sale {
  id: string;
  ts: number;
  date: string;
  partId: string | null;
  partName: string;
  quantity: number;
  sellPrice: number;
  buyPrice: number;
  total: number;
  profit: number;
}

export interface WorkerT {
  id: string;
  name: string;
}

export interface Work {
  id: string;
  ts: number;
  workerId: string;
  date: string;
  car: string;
  work: string;
  cost: number;
}

export interface CarT {
  id: string;
  mark: string;
  number: string;
  owner: string;
  created: string;
  ts: number;
}

export interface CarWork {
  id: string;
  ts: number;
  carId: string;
  date: string;
  description: string;
  cost: number;
}

export interface CarPart {
  id: string;
  ts: number;
  carId: string;
  date: string;
  partName: string;
  artikul: string;
  quantity: number;
  price: number;
}

export interface ShopState {
  firms: Firm[];
  parts: Part[];
  arrivals: Arrival[];
  sales: Sale[];
  workers: WorkerT[];
  works: Work[];
  cars: CarT[];
  carWorks: CarWork[];
  carParts: CarPart[];
}

export type ViewId =
  | "dash"
  | "arrivals"
  | "parts"
  | "sales"
  | "works"
  | "cars"
  | "history";
