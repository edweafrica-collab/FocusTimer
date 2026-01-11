const els = {
    timerDisplay: document.getElementById('timer-display'),
    sessionTitle: document.getElementById('session-title'),
    warningBorder: document.getElementById('warning-border'),
    overtimeMessage: document.getElementById('overtime-message'),
    container: document.querySelector('.container')
};

// State for marquee check
let lastTitle = null;

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
    // 1. Session Title
    if (state.sessionTitle !== lastTitle) {
        // Build inner span for marquee logic
        els.sessionTitle.innerHTML = `<span>${state.sessionTitle || ""}</span>`;
        checkMarquee();
        lastTitle = state.sessionTitle;
    }

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
        fitTimerText(state.timeStr);
    }

    // 2.5 Overtime Mode (Body Style)
    if (state.warningLevel === 'OVERTIME') {
        document.body.classList.add('overtime-mode');
    } else {
        document.body.classList.remove('overtime-mode');
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

function checkMarquee() {
    const span = els.sessionTitle.querySelector('span');
    if (!span) return;

    // Reset to check width
    span.className = '';

    if (span.offsetWidth > els.sessionTitle.offsetWidth) {
        span.className = 'marquee';
    } else {
        span.className = '';
    }
}

// Escape Key to Close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        window.electronAPI.sendViewerEscape();
    }
});

function fitTimerText(text) {
    if (!text) return;
    const charCount = text.length;

    // Absolute centering:
    // We want the text to be as big as possible but fit within screen width.
    // Base size 35vw is huge.

    let newSize = 35; // Start HUGE

    // Approx: Mono char width is ~0.6em.
    // 5 chars (00:00) at 35vw -> 35 * 0.6 * 5 = 105vw (Too big)

    // Safety max width: 90vw.
    // width = fontSize * 0.6 * charCount
    // fontSize = width / (0.6 * charCount)
    // fontSize = 90 / (0.6 * charCount)
    // 5 chars -> 90 / 3 = 30vw.
    // 6 chars (100:00) -> 90 / 3.6 = 25vw.

    newSize = 90 / (0.6 * charCount);

    // Cap max size
    if (newSize > 35) newSize = 35;

    els.timerDisplay.style.fontSize = `${newSize}vw`;
}

// Initial Sync request (in case we launched after dashboard)
window.electronAPI.onRequestStateSync(() => {
    // We actually don't need to do anything, because main.js 
    // detects the re-launch and asks Dashboard to send data.
    // But we might need to be ready.
});
