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
    launchViewer: (displayId) => ipcRenderer.send('launch-viewer', displayId),

    // State Sync (for recovery)
    onRequestStateSync: (callback) => ipcRenderer.on('request-state-sync', (_event) => callback()),

    // Persistence
    saveState: (state) => ipcRenderer.send('save-state', state),
    loadState: () => ipcRenderer.invoke('load-state'),

    // Viewer Control
    sendViewerEscape: () => ipcRenderer.send('viewer-escape'),

    // App Control
    onAppClosing: (callback) => ipcRenderer.on('app-closing', callback),
    sendCloseResult: (isRunning) => ipcRenderer.send('close-check-result', { isRunning }),
});
