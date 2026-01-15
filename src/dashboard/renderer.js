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
    connectionStatus: document.getElementById('connection-status'),
    btnShowViewer: document.getElementById('btn-show-viewer'),
    // Modals
    singleModal: document.getElementById('single-screen-modal'),
    btnSingleLaunch: document.getElementById('btn-single-launch'),
    btnSingleCancel: document.getElementById('btn-single-cancel')
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
    els.btnStart.addEventListener('click', () => startSequence());
    els.btnPause.addEventListener('click', () => timer.pause());
    els.btnStop.addEventListener('click', () => {
        // Strict Reset: Clear everything to zero
        timer.stop();
        timer.totalDuration = 0;
        timer.remaining = 0;
        timer.warningLevel = null; // Clear warnings
        timer.emitUpdate(); // Force UI update to 00:00

        // INSTANT FEEDBACK v1.1.3
        updateDisplay("00:00", 0, null);

        // RESET INPUTS v1.1.4
        els.minInput.value = "";
        els.secInput.value = "";

        saveCurrentState();
    });

    els.presets.forEach(btn => {
        btn.addEventListener('click', () => {
            const min = parseInt(btn.dataset.time);

            // Additive logic: Add to remaining time instead of setting duration
            const msToAdd = min * 60 * 1000;

            // If timer was stopped/reset (IDLE), treat as setting a new duration from 0
            if (timer.status === 'IDLE' && timer.remaining <= 0) {
                timer.setDuration(min);
            } else {
                timer.remaining += msToAdd;
                timer.totalDuration += msToAdd; // Extend total duration too so progress logic stays consistent?
                // Actually, if we add 10m to a 20m timer that has 5m left... remaining becomes 15m.
                // Total duration should probably expand to reflect the session length increased?
                // Or user just wants more time on clock.
                // "Each click adds its value to the current timer value."

                timer.emitUpdate(); // Force UI update

                // INSTANT FEEDBACK v1.1.3s
                // Update display immediately so it doesn't wait for tick
                updateDisplay(timer.formatTime(timer.remaining), timer.remaining, timer.warningLevel);
            }

            // Sync inputs to show new remaining duration (approximated to min/sec)
            // Wait, we shouldn't necessarily update inputs to match remaining exactly if inputs are used for "Set Duration".
            // But usually inputs reflect current state?
            // Existing code: els.minInput.value = min; (sets inputs to the button value)

            // Let's update inputs to match current remaining time so user sees what's happening
            const totalSec = Math.ceil(timer.remaining / 1000);
            if (totalSec > 0) {
                els.minInput.value = Math.floor(totalSec / 60);
                els.secInput.value = totalSec % 60;
            }

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

    // Enter Key to Start
    const handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            startSequence();
            els.minInput.blur();
            els.secInput.blur();
        }
    };
    els.minInput.addEventListener('keydown', handleEnterKey);
    els.secInput.addEventListener('keydown', handleEnterKey);

    // Session Title Logic (v1.1.7 - Manual Control)
    const btnPublish = document.getElementById('btn-publish-title');
    const btnClear = document.getElementById('btn-clear-title');

    // Remove "Live Typing" - Only update on button click
    btnPublish.addEventListener('click', () => {
        sessionTitle = els.sessionTitle.value;
        broadcastState();
        // User requested NO persistence for title on restart.
        // But we DO save it to the current running state in case of crash verify?
        // User said: "if user restarts the app... user should have to type title again."
        // So we will NOT include it in saveState? Or we save it but don't load it?
        // Let's safe it to session state so if viewer reconnects it gets it.
        // But on FRESH APP RELAUNCH, we wipe everything anyway in main.js? 
        // FocusTimer has "Fresh Start" logic in main.js?
        // Let's ensure saveCurrentState includes it for *runtime* stability, but distinct form reload.
        saveCurrentState();
    });

    btnClear.addEventListener('click', () => {
        els.sessionTitle.value = ""; // Clear input
        sessionTitle = "";           // Clear state
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

                // v1.1.7: Title does NOT persist on restart.
                sessionTitle = "";
                els.sessionTitle.value = "";

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
                // Esc logic for dashboard usually stops? Or just ignores?
                // PRD said Esc returns control. If focus is here, maybe Stop?
                // Let's keep it safe: Stop if running? Or just do nothing.
                // "The Escape (Esc) key must act as a universal hotkey to... Return control to the Operator Dashboard"
                // If we are already here, maybe nothing.
                break;
        }
    });

    // App Close Safety
    // App Close Safety (Main Process Driven)
    window.electronAPI.onAppClosing(() => {
        window.electronAPI.sendCloseResult(timer.status === 'RUNNING');
    });

    window.onbeforeunload = null;

    // Show Viewer Button Logic
    els.btnShowViewer.onclick = async () => {
        const screens = await window.electronAPI.getScreens();
        if (screens.length > 1) {
            window.electronAPI.launchViewer(screens[1].id || screens[0].id); // Secondary or Primary fallback
        } else {
            window.electronAPI.launchViewer(screens[0].id);
        }
    };

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
        // Multi-screen: Show connection status with dot indicator
        els.connectionStatus.textContent = 'Dual Display';
        els.connectionStatus.classList.add('connected');
    } else {
        // Single Screen
        els.connectionStatus.textContent = 'Single Display';
        els.connectionStatus.classList.remove('connected');
    }
}

async function startSequence() {
    if (timer.status === 'RUNNING') return; // Already running

    const screens = await window.electronAPI.getScreens();

    if (screens.length > 1) {
        // Multi-screen: Auto launch on secondary
        const secondary = screens.find(s => s.id !== 1) || screens[1];
        window.electronAPI.launchViewer(secondary.id);
        timer.start();
    } else {
        // Single Screen: Prompt
        els.singleModal.hidden = false;

        els.btnSingleLaunch.onclick = () => {
            els.singleModal.hidden = true;
            window.electronAPI.launchViewer(screens[0].id);
            timer.start();
        };

        els.btnSingleCancel.onclick = () => {
            // User cancelled. Do not start.
            els.singleModal.hidden = true;
        };
    }
}

function updateDisplay(timeStr, ms, warningLevel) {
    els.timeReadout.textContent = timeStr;

    // Remove all warning classes first
    els.timeReadout.classList.remove('warning-gentle', 'warning-critical');

    // Apply warning class based on level
    if (warningLevel === 'CRITICAL' || warningLevel === 'OVERTIME') {
        els.timeReadout.classList.add('warning-critical');
    } else if (warningLevel === 'GENTLE') {
        els.timeReadout.classList.add('warning-gentle');
    }
}

function updateControls(status) {
    // Human-friendly status text
    const statusMap = {
        'IDLE': 'Ready',
        'RUNNING': 'Running',
        'PAUSED': 'Paused'
    };
    els.timerStatus.textContent = statusMap[status] || status;

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

    // Show/Hide "Show Viewer" button based on running state
    // We want it visible if we are running, in case user closed the window.
    if (status === 'RUNNING') {
        els.btnShowViewer.hidden = false;
    } else {
        els.btnShowViewer.hidden = true;
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
