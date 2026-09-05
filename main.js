const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

let splashWindow;
let mainWindow;

function createSplashWindow() {
  // 1. Cria a janela menor de carregamento (Splash Screen) sem bordas
  splashWindow = new BrowserWindow({
    width: 650,
    height: 420,
    frame: false,
    transparent: true,
    center: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  splashWindow.loadFile('splash.html');

  // 2. Aguarda 2.8 segundos (tempo da barra encher), fecha o splash e abre o app principal
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
    }
    createMainWindow();
  }, 5000);
}

function createMainWindow() {
  // 3. Abre a janela principal carregando o seu index.html intacto
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Delta GIS Web",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  mainWindow.loadFile('index.html');
}

// Quando o Electron estiver pronto, inicia o fluxo
app.whenReady().then(() => {
  createSplashWindow(); // Chama a tela de carregamento primeiro
  
  // Dispara a verificação de atualizações no fundo
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createSplashWindow();
  });
});

// Fecha o aplicativo quando todas as janelas forem fechadas (padrão do Windows)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});