const { app, BrowserWindow, ipcMain, protocol, net, Menu } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 960, minHeight: 540, backgroundColor: '#050407', title: 'SKVERNA', autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => win.show());
  win.loadURL('app://game/index.html');
  win.webContents.on('before-input-event', (e, i) => { if (i.type === 'keyDown' && i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); } if (i.type === 'keyDown' && i.key === 'F12' && i.control) win.webContents.toggleDevTools(); });
}
app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const u = new URL(req.url); let p = decodeURIComponent(u.pathname); if (p === '/' || p === '') p = '/index.html';
    const f = path.normalize(path.join(__dirname, p)); if (!f.startsWith(__dirname)) return new Response('forbidden', { status: 403 });
    return net.fetch(pathToFileURL(f).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
ipcMain.handle('fullscreen', (e, v) => { if (win) win.setFullScreen(!!v); return !!v; });
ipcMain.on('quit', () => app.quit());
app.on('window-all-closed', () => app.quit());
