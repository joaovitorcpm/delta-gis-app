const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const { autoUpdater } = require("electron-updater");
let mainWindow;

function createWindow() {
  // Cria a janela principal do aplicativo
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Delta GIS Web",
    autoHideMenuBar: true, // Esconde a barra de menu padrão (Arquivo, Editar, etc)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Carrega a interface do seu mapa
  mainWindow.loadFile('index.html');
}

// Quando o Electron estiver pronto, abre a janela
app.whenReady().then(() => {
  createWindow();
  // Dispara a verificação de atualizações no fundo
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Fecha o aplicativo quando todas as janelas forem fechadas (padrão do Windows)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});