const timer = new FocusTimer();

// UI Elements
const els = {
    timeReadout: document.getElementById('main-timer'),
    timerStatus: document.getElementById('timer-status'),
    minInput: document.getElementById('input-min'),
    secInput: document.getElementById('input-sec'),
    btnStart: document.getElementById('btn-start'),
    btnPause: document.getElementById('btn-pause'),
    btnStop: document.getElementById('btn-stop'),
    presets: document.querySelectorAll('.preset-btn'),
    adjusts: document.querySelectorAll('.adjust-btn'),
    sessionTitle: document.getElementById('session-title'),
    btnUpdateTitle: document.getElementById('btn-update-title'),
    connectionStatus: document.getElementById('connection-status')
};

// State
let sessionTitle = "";

// Initialize
function init() {
    // Setup Timer Callbacks
    timer.callbacks.onTick = (timeStr, ms, warningLevel) => {
        updateDisplay(timeStr, ms, warningLevel);
        broadcastState(); // Sync viewer every tick
    };

    timer.callbacks.onStatusChange = (state) => {
        updateControls(state.status);
        broadcastState();
    };

    timer.callbacks.onWarning = (level) => {
        // Warning logic is handled in viewer, but we can reflect it here too if needed
        // For dashboard, we just keep the time correct.
    };

    // Event Listeners
    els.btnStart.addEventListener('click', () => timer.start());
    els.btnPause.addEventListener('click', () => timer.pause());
    els.btnStop.addEventListener('click', () => {
        // If running, confirm? For MVP speed, maybe just stop or require double click? 
        // PRD says "Stop / Reset (clears current session)". Simple click OK.
        timer.stop();
        saveCurrentState(); // Save the STOPPED state
    });

    els.presets.forEach(btn => {
        btn.addEventListener('click', () => {
            const min = parseInt(btn.dataset.time);
            timer.setDuration(min);
            els.minInput.value = min;
            els.secInput.value = "00";
            saveCurrentState();
        });
    });

    els.adjusts.forEach(btn => {
        btn.addEventListener('click', () => {
            const changeSec = parseInt(btn.dataset.adjust);
            // Modify remaining time directly? or total duration?
            // PRD says "Add / Subtract Time". Usually this modifies remaining time.
            timer.remaining += (changeSec * 1000);
            timer.emitUpdate(); // Force UI update
            saveCurrentState();
        });
    });

    // Manual Input Handling
    const handleManualInput = () => {
        const min = parseInt(els.minInput.value) || 0;
        const sec = parseInt(els.secInput.value) || 0;
        timer.setDurationSeconds((min * 60) + sec);
        saveCurrentState();
    };

    els.minInput.addEventListener('change', handleManualInput);
    els.secInput.addEventListener('change', handleManualInput);

    els.sessionTitle.addEventListener('input', (e) => {
        sessionTitle = e.target.value;
        broadcastState();
        saveCurrentState();
    });

    // Resume Logic
    const modal = document.getElementById('recovery-modal');
    const btnResume = document.getElementById('btn-resume');
    const btnDiscard = document.getElementById('btn-discard');
    const recoveryDesc = document.getElementById('recovery-desc');

    window.electronAPI.loadState().then(savedState => {
        if (savedState && savedState.status !== 'IDLE' && savedState.remaining > -999999) {
            // Found a relevant session
            // Format time for display
            // We should check if it's super old? But for now assume relevant.
            recoveryDesc.textContent = `Found a session (${savedState.status}) with ${timer.formatTime(savedState.remaining)} remaining. Resume?`;
            modal.hidden = false;

            btnResume.onclick = () => {
                // Restore
                timer.totalDuration = savedState.totalDuration;
                timer.remaining = savedState.remaining;
                timer.status = savedState.status; // Paused or Running
                // If it was RUNNING, do we auto-start? 
                // "Resume previous session" implies continuing.
                // But maybe safer to start in PAUSED state if it was running?
                // Let's restore exact state. If it was running, it starts running.

                sessionTitle = savedState.sessionTitle || "";
                els.sessionTitle.value = sessionTitle;

                if (timer.status === 'RUNNING') {
                    timer.start();
                } else {
                    timer.emitUpdate();
                }
                modal.hidden = true;
            };

            btnDiscard.onclick = () => {
                modal.hidden = true;
                // Just clear state
                saveCurrentState();
            };
        }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT') return; // Don't trigger when typing

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (timer.status === 'RUNNING') timer.pause();
                else timer.start();
                break;
            case 'Escape':
                e.preventDefault();
                timer.stop();
                break;
        }
    });

    // Check Multi-screen status
    checkScreens();

    // Recover state request (if viewer crashes and comes back)
    window.electronAPI.onRequestStateSync(() => {
        console.log("Viewer requested state sync");
        broadcastState();
    });
}

async function checkScreens() {
    const screens = await window.electronAPI.getScreens();
    if (screens.length > 1) {
        els.connectionStatus.textContent = `Viewer Active on Display 2 (${screens.length} detected)`;
        els.connectionStatus.style.color = '#4CAF50';
    } else {
        els.connectionStatus.textContent = "Single Display Mode";
        els.connectionStatus.style.color = '#B0B0B0';
    }
}

function updateDisplay(timeStr, ms, warningLevel) {
    els.timeReadout.textContent = timeStr;

    // Visual feedback on Dashboard for warnings?
    if (warningLevel === 'CRITICAL') {
        els.timeReadout.style.color = 'var(--warning-critical)';
    } else if (warningLevel === 'GENTLE') {
        els.timeReadout.style.color = 'var(--warning-gentle)';
    } else if (warningLevel === 'OVERTIME') {
        els.timeReadout.style.color = 'var(--warning-critical)';
    } else {
        els.timeReadout.style.color = 'white';
    }
}

function updateControls(status) {
    els.timerStatus.textContent = status;

    if (status === 'RUNNING') {
        els.btnStart.hidden = true;
        els.btnPause.hidden = false;
        els.minInput.disabled = true;
        els.secInput.disabled = true;
    } else {
        els.btnStart.hidden = false;
        els.btnPause.hidden = true;
        els.minInput.disabled = false;
        els.secInput.disabled = false;
    }
}

function broadcastState() {
    const state = {
        timeStr: timer.formatTime(timer.remaining),
        remaining: timer.remaining,
        status: timer.status,
        warningLevel: timer.warningLevel,
        sessionTitle: sessionTitle,
        isOvertime: timer.remaining <= 0
    };
    window.electronAPI.sendTimerUpdate(state);
}

function saveCurrentState() {
    const state = {
        remaining: timer.remaining,
        totalDuration: timer.totalDuration,
        status: timer.status,
        sessionTitle: sessionTitle,
        warningLevel: timer.warningLevel
    };
    window.electronAPI.saveState(state);
}

// Modify tick update to save state casually (maybe not every 100ms? that's too much disk IO)
// Let's save on status change (already done) and maybe every 1 second?
// timer.js calls onTick every 100ms.
// Let's implement throttling for save.
let lastSave = 0;
timer.callbacks.onTick = (timeStr, ms, warningLevel) => {
    updateDisplay(timeStr, ms, warningLevel);
    broadcastState();

    const now = Date.now();
    if (now - lastSave > 2000) { // Save every 2 seconds roughly
        saveCurrentState();
        lastSave = now;
    }
};

timer.callbacks.onStatusChange = (state) => {
    updateControls(state.status);
    broadcastState();
    saveCurrentState(); // Always save on status change
    lastSave = Date.now();
};

init();
