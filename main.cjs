/* ────────────────────────────────────────────────────────────────
   Автомастерская — точка входа Electron (десктопная обёртка)
   Загружает собранное веб-приложение из dist/index.html
   ──────────────────────────────────────────────────────────────── */
const { app, BrowserWindow, session, dialog } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    backgroundColor: "#0a0e13",
    autoHideMenuBar: true,
    title: "Автомастерская",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

/* Скачивание резервной копии (JSON) — через диалог «Сохранить как»,
   чтобы бэкап не терялся в папке «Загрузки» */
function setupDownloadDialog() {
  session.defaultSession.on("will-download", (event, item) => {
    const win = BrowserWindow.getFocusedWindow();
    const defaultPath = path.join(
      app.getPath("documents"),
      item.getFilename() || "avtomasterskaya-backup.json"
    );
    const savePath = dialog.showSaveDialogSync(win, {
      title: "Сохранить резервную копию",
      defaultPath,
      filters: [{ name: "Резервная копия (JSON)", extensions: ["json"] }],
    });
    if (savePath) {
      item.setSavePath(savePath);
    } else {
      item.cancel();
    }
  });
}

app.whenReady().then(() => {
  setupDownloadDialog();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
