const { app, BrowserWindow, screen, ipcMain, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const USER_DATA_PATH = app.getPath('userData');
const STATE_FILE = path.join(USER_DATA_PATH, 'session-state.json');

let dashboardWindow = null;
let viewerWindow = null;
let splashWindow = null;
let viewerRetryCount = 0;
const MAX_RETRIES = 5;

// Prevent sleep
const powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');

function createSplash() {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 400,
        frame: false,
        alwaysOnTop: true,
        transparent: false,
        backgroundColor: '#121212',
        resizable: false,
        webPreferences: {
            nodeIntegration: true, // For simple shell usage in splash
            contextIsolation: false
        },
        title: 'FocusTime'
    });

    splashWindow.loadFile(path.join(__dirname, 'src', 'splash', 'index.html'));

    // Auto-close splash and launch dashboard after 3 seconds
    setTimeout(() => {
        createDashboard();
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
        }
        splashWindow = null;
    }, 3000);
}

function createDashboard() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    dashboardWindow = new BrowserWindow({
        width: 600,
        height: 920,
        x: primaryDisplay.bounds.x + (width - 600) / 2,
        y: primaryDisplay.bounds.y + (height - 920) / 2,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'FocusTime - Dashboard',
        autoHideMenuBar: true,
        show: false
    });

    dashboardWindow.loadFile(path.join(__dirname, 'src', 'dashboard', 'index.html'));

    dashboardWindow.once('ready-to-show', () => {
        dashboardWindow.show();
    });

    // ROBUST CLOSE HANDLING
    dashboardWindow.on('close', async (e) => {
        // Check if we should warn (need to ask Renderer if running, or just check shared state if we had it).
        // Since strict Main/Renderer isolation, asking renderer is best.
        // But to be "Enforced", we can use a simpler approach if we don't want IPC race conditions:
        // Just always confirm if the user tries to close? No, annoying.

        // Better: We send a synchronous IPC check or we just use the renderer's logic but ensure it works.
        // Actually, the previous 'onbeforeunload' in renderer failed because 'confirm' UI can be blocked.
        // Let's use `dialog.showMessageBox` trigger from the Renderer?
        // NO, user said "windows x button doesnt seem to close". 
        // This implies the previous logic `e.returnValue = false` worked TOO well (prevented close) but didn't show the prompt?
        // Or the prompt blocked.

        // Let's rely on the Renderer sending an IPC "can-i-close" message? No, 'close' event happens first.

        // STRATEGY: 
        // 1. Let `close` proceed normally.
        // 2. In Renderer `onbeforeunload`, use `ipcRenderer.invoke('confirm-close')` (SYNC/Blocking if possible, or preventDefault -> Async -> Close).
        // The standard customized pattern:
        /*
           window.onbeforeunload = (e) => {
               e.returnValue = false; // Cancel close immediately
               window.electronAPI.confirmExit().then(shouldClose => {
                   if (shouldClose) window.electronAPI.forceClose();
               });
           }
        */
        // But wait, `main.js` handles the force close.

        // Let's implement the `close` handler HERE to send a message to renderer?
        // Let's try the `e.preventDefault()` in Main Process approach.
        /*
        if (!app.isQuiting) {
            e.preventDefault();
            dashboardWindow.webContents.send('app-closing');
        }
        */
    });

    dashboardWindow.on('closed', () => {
        dashboardWindow = null;
        if (viewerWindow) {
            viewerWindow.close();
        }
        app.quit();
    });
}

function createViewer(displayId = null) {
    if (viewerWindow) return;

    const displays = screen.getAllDisplays();
    let targetDisplay;

    if (displayId) {
        targetDisplay = displays.find(d => d.id === displayId);
    }

    if (!targetDisplay) {
        // Prefer secondary display, fallback to primary if only 1 exists
        const externalDisplay = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);
        targetDisplay = externalDisplay || screen.getPrimaryDisplay();
    }

    viewerWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: 800,
        height: 600, // Will be maximized/fullscreen
        fullscreen: true,
        frame: false,
        skipTaskbar: true,
        alwaysOnTop: true, // Ensure it stays on top of notifications
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        backgroundColor: '#000000',
        title: 'FocusTime - Viewer',
    });

    viewerWindow.loadFile(path.join(__dirname, 'src', 'viewer', 'index.html'));

    // Viewer Silent Recovery
    viewerWindow.webContents.on('render-process-gone', (event, details) => {
        console.log('Viewer render process gone:', details.reason);
        viewerWindow = null;
        if (viewerRetryCount < MAX_RETRIES) {
            viewerRetryCount++;
            // Silent relaunch
            setTimeout(() => {
                createViewer();
                // Re-send current state from Dashboard to new Viewer
                if (dashboardWindow) {
                    dashboardWindow.webContents.send('request-state-sync');
                }
            }, 500);
        }
    });

    // Immediate State Sync Request upon load
    viewerWindow.webContents.once('did-finish-load', () => {
        if (dashboardWindow) {
            dashboardWindow.webContents.send('request-state-sync');
        }
    });

    viewerWindow.on('closed', () => {
        viewerWindow = null;
    });
}

// IPC Handlers
ipcMain.handle('get-screens', () => {
    return screen.getAllDisplays().map(d => ({
        id: d.id,
        label: d.label,
        bounds: d.bounds
    }));
});

ipcMain.on('update-timer', (event, data) => {
    if (viewerWindow && !viewerWindow.isDestroyed()) {
        viewerWindow.webContents.send('update-timer', data);
    }
});

ipcMain.on('broadcast-warning', (event, data) => {
    if (viewerWindow && !viewerWindow.isDestroyed()) {
        viewerWindow.webContents.send('update-warning', data);
    }
});

ipcMain.on('launch-viewer', (event, displayId) => {
    createViewer(displayId);
});

ipcMain.on('viewer-escape', () => {
    if (viewerWindow && !viewerWindow.isDestroyed()) {
        viewerWindow.close();
        viewerWindow = null;
    }
});

// ipcMain.handle('show-exit-confirm') removed (Main Loop Logic used instead)

ipcMain.on('force-quit', () => {
    app.quit();
});

// Persistence Handlers
ipcMain.on('save-state', (event, state) => {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state));
    } catch (err) {
        console.error('Failed to save state:', err);
    }
});

ipcMain.handle('load-state', async () => {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Failed to load state:', err);
    }
    return null;
});

app.whenReady().then(() => {
    // Fresh Start: Delete previous state if exists
    try {
        if (fs.existsSync(STATE_FILE)) {
            fs.unlinkSync(STATE_FILE);
            console.log('Previous session state cleared (Fresh Start).');
        }
    } catch (err) {
        console.error('Failed to clear previous state:', err);
    }

    createSplash();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createSplash();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Clean up wake lock on exit
app.on('will-quit', () => {
    if (powerSaveBlocker.isStarted(powerSaveBlockerId)) {
        powerSaveBlocker.stop(powerSaveBlockerId);
    }
});
