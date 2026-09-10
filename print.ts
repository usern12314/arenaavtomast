import { fmtDate, fmtMoney, fmtNum, todayISO } from "./utils";
import type { CarPart, CarT, CarWork } from "./types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function printCarJournal(
  car: CarT,
  works: CarWork[],
  parts: CarPart[]
): boolean {
  const wTotal = works.reduce((a, w) => a + w.cost, 0);
  const pTotal = parts.reduce((a, p) => a + p.quantity * p.price, 0);

  const worksTable = works.length
    ? `<table>
        <tr><th>Дата</th><th>Описание работы</th><th class="r">Стоимость</th></tr>
        ${works
          .map(
            (w) =>
              `<tr><td>${fmtDate(w.date)}</td><td>${esc(w.description)}</td><td class="r">${fmtNum(w.cost)}</td></tr>`
          )
          .join("")}
      </table>
      <p class="sub2">Итого работы: <b>${fmtMoney(wTotal)}</b></p>`
    : "<p>Работ нет.</p>";

  const partsTable = parts.length
    ? `<table>
        <tr><th>Дата</th><th>Запчасть</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Сумма</th></tr>
        ${parts
          .map(
            (p) =>
              `<tr><td>${fmtDate(p.date)}</td><td>${esc(p.partName)}${p.artikul ? ` (${esc(p.artikul)})` : ""}</td><td class="r">${p.quantity}</td><td class="r">${fmtNum(p.price)}</td><td class="r">${fmtNum(p.quantity * p.price)}</td></tr>`
          )
          .join("")}
      </table>
      <p class="sub2">Итого запчасти: <b>${fmtMoney(pTotal)}</b></p>`
    : "<p>Запчастей нет.</p>";

  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Журнал — ${esc(car.mark)}</title>
<style>
  body { font-family: "Courier New", monospace; max-width: 720px; margin: 28px auto; padding: 0 18px; color: #111; font-size: 13px; }
  h1 { font-size: 17px; margin: 0 0 6px; letter-spacing: .04em; }
  h2 { font-size: 12.5px; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: .1em; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 5px 4px; font-size: 12.5px; }
  th { border-bottom: 1.6px solid #000; font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; }
  td { border-bottom: 1px dashed #999; }
  .r { text-align: right; }
  .sub { color: #333; margin: 0 0 10px; }
  .sub2 { text-align: right; margin: 6px 0 0; }
  .line { border-top: 1.8px solid #000; margin: 10px 0; }
  .tot { border-top: 2.5px solid #000; margin-top: 18px; padding-top: 10px; text-align: right; }
  .big { font-size: 17px; font-weight: 700; margin-top: 4px; }
</style>
</head>
<body>
  <h1>АВТОМАСТЕРСКАЯ · ЖУРНАЛ АВТОМОБИЛЯ</h1>
  <div class="line"></div>
  <p class="sub">
    Автомобиль: <b>${esc(car.mark)}</b>${car.number ? ` · номер: <b>${esc(car.number)}</b>` : ""}<br>
    ${car.owner ? `Владелец: ${esc(car.owner)}<br>` : ""}
    Дата печати: ${fmtDate(todayISO())}
  </p>
  <h2>Выполненные работы</h2>
  ${worksTable}
  <h2>Использованные запчасти</h2>
  ${partsTable}
  <div class="tot">
    Итого работы: ${fmtMoney(wTotal)} &nbsp;·&nbsp; Итого запчасти: ${fmtMoney(pTotal)}
    <div class="big">ИТОГО: ${fmtMoney(wTotal + pTotal)}</div>
  </div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=840,height=920");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  window.setTimeout(() => w.print(), 400);
  return true;
}
