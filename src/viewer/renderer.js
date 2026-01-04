const els = {
    timerDisplay: document.getElementById('timer-display'),
    sessionTitle: document.getElementById('session-title'),
    warningBorder: document.getElementById('warning-border'),
    overtimeMessage: document.getElementById('overtime-message')
};

// Prevent any error dialogs
window.onerror = function () {
    return true; // Suppress
};

window.electronAPI.onTimerUpdate((state) => {
    updateUI(state);
});

// Also listen for separate warning broadcasts if any
window.electronAPI.onWarningUpdate((level) => {
    // Already handled in full state update usually, but good fallback
});

function updateUI(state) {
    // 1. Session Title
    els.sessionTitle.textContent = state.sessionTitle || "";

    // 2. Timer / Overtime
    if (state.warningLevel === 'OVERTIME') {
        els.timerDisplay.hidden = true;
        els.overtimeMessage.hidden = false;
        // Optional: show negative count-up? PRD says "Timer replaced with TIME UP!". 
        // We will stick to text only for the main viewer for "Calmness".
    } else {
        els.timerDisplay.hidden = false;
        els.overtimeMessage.hidden = true;
        els.timerDisplay.textContent = state.timeStr;
    }

    // 3. Warnings (Border)
    // Clear classes logic
    els.warningBorder.className = 'warning-overlay'; // Reset

    if (state.warningLevel === 'GENTLE') {
        els.warningBorder.classList.add('warning-gentle');
    } else if (state.warningLevel === 'CRITICAL' || state.warningLevel === 'OVERTIME') {
        // Overtime also usually implies critical red state or similar attention?
        // PRD 5.3: Overtime -> "Timer replaced with TIME UP! Color: Red"
        // It doesn't explicitly say "Stop pulsing border". 
        // But usually "TIME UP" in Red is enough.
        // Let's keep Critical pulsing for CRITICAL, but maybe solid or pulsing for OVERTIME?
        // "Calm": maybe stop pulsing once it hits overtime and just show static red message?
        // PRD 5.3: "State C: Overtime... Color: Red". Nothing about border.
        // Let's assume border stops in Overtime to avoid visual noise vs the big Text.
        if (state.warningLevel === 'CRITICAL') {
            els.warningBorder.classList.add('warning-critical');
        }
    }
}

// Initial Sync request (in case we launched after dashboard)
window.electronAPI.onRequestStateSync(() => {
    // We actually don't need to do anything, because main.js 
    // detects the re-launch and asks Dashboard to send data.
    // But we might need to be ready.
});
