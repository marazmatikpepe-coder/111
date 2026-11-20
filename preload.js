const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('skverna', {
  isElectron: true,
  fullscreen: (v) => ipcRenderer.invoke('fullscreen', v),
  quit: () => ipcRenderer.send('quit')
});
