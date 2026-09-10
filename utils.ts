export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const todayISO = () => toISO(new Date());

export const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};

export const monthStartISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
};

export const isISO = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export const fmtDate = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || "—";
};

export const fmtDateShort = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}` : iso;
};

const nf2 = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const nf0 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export const fmtNum = (n: number) => nf2.format(n || 0);
export const fmtMoney = (n: number) => `${nf2.format(n || 0)} ₽`;
export const fmtInt = (n: number) => nf0.format(n || 0);

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const parseNum = (s: string): number => {
  const v = parseFloat(String(s).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
};

export const genId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

export const todayHumanFull = () => {
  const d = new Date();
  const date = d.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return date.charAt(0).toUpperCase() + date.slice(1);
};

export const downloadFile = (
  filename: string,
  content: string,
  mime = "application/json"
) => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

export const toCSV = (rows: (string | number)[][]) =>
  rows
    .map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")
    )
    .join("\n");
