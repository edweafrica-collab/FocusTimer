const { app, BrowserWindow, screen, ipcMain, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const USER_DATA_PATH = app.getPath('userData');
const STATE_FILE = path.join(USER_DATA_PATH, 'session-state.json');

let dashboardWindow = null;
let viewerWindow = null;
let viewerRetryCount = 0;
const MAX_RETRIES = 5;

// Prevent sleep
const powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');

function createDashboard() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    dashboardWindow = new BrowserWindow({
        width: 600,
        height: 800,
        x: primaryDisplay.bounds.x + (width - 600) / 2,
        y: primaryDisplay.bounds.y + (height - 800) / 2,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'FocusTime - Dashboard',
        autoHideMenuBar: true,
    });

    dashboardWindow.loadFile(path.join(__dirname, 'src', 'dashboard', 'index.html'));

    dashboardWindow.on('closed', () => {
        dashboardWindow = null;
        // If dashboard closes, app should likely exit or at least close viewer
        if (viewerWindow) {
            viewerWindow.close();
        }
        app.quit();
    });
}

function createViewer() {
    if (viewerWindow) return;

    const displays = screen.getAllDisplays();
    // Prefer secondary display, fallback to primary if only 1 exists
    const externalDisplay = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);
    const targetDisplay = externalDisplay || screen.getPrimaryDisplay();

    viewerWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: 800,
        height: 600, // Will be maximized/fullscreen
        fullscreen: true,
        frame: false,
        skipTaskbar: true, // Keep it cleaner
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
                // TODO: Re-send current state from Dashboard to new Viewer
                if (dashboardWindow) {
                    dashboardWindow.webContents.send('request-state-sync');
                }
            }, 500);
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
    createDashboard();
    createViewer();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createDashboard();
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
