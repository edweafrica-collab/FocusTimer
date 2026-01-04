const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Timer updates (Dashboard -> Main -> Viewer)
    sendTimerUpdate: (data) => ipcRenderer.send('update-timer', data),
    onTimerUpdate: (callback) => ipcRenderer.on('update-timer', (_event, value) => callback(value)),

    // Warning state updates
    sendWarningUpdate: (data) => ipcRenderer.send('broadcast-warning', data),
    onWarningUpdate: (callback) => ipcRenderer.on('update-warning', (_event, value) => callback(value)),

    // System
    getScreens: () => ipcRenderer.invoke('get-screens'),

    // State Sync (for recovery)
    onRequestStateSync: (callback) => ipcRenderer.on('request-state-sync', (_event) => callback()),

    // Persistence
    saveState: (state) => ipcRenderer.send('save-state', state),
    loadState: () => ipcRenderer.invoke('load-state'),
});
