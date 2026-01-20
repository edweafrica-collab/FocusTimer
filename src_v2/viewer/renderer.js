const els = {
    timerDisplay: document.getElementById('timer-display'),
    overtimeDisplay: document.getElementById('overtime-display'),
    sessionTitle: document.getElementById('session-title'),
    ambientGlow: document.getElementById('ambient-glow'),
    body: document.getElementById('viewer-body'),
    timerContainer: document.getElementById('timer-container')
};

// State
let lastTitle = "";
let isOvertime = false;

// IPC Listeners
window.electronAPI.onTimerUpdate((state) => {
    updateUI(state);
});

function updateUI(state) {
    // 1. Session Title
    if (state.sessionTitle !== lastTitle) {
        els.sessionTitle.textContent = state.sessionTitle || "";
        els.sessionTitle.style.opacity = state.sessionTitle ? "1" : "0";
        lastTitle = state.sessionTitle;
    }

    // 2. Timer / Overtime Logic
    if (state.isOvertime) {
        if (!isOvertime) {
            enterOvertime();
        }
    } else {
        if (isOvertime) {
            exitOvertime();
        }
        // Update timer text
        els.timerDisplay.textContent = state.timeStr;
    }

    // 3. Warning States (Ambient Glow)
    updateGlow(state.warningLevel);
}

function enterOvertime() {
    isOvertime = true;

    // Dissolve Transition
    // 1. Fade out numbers
    els.timerDisplay.style.opacity = '0';

    setTimeout(() => {
        // 2. Switch to hidden
        els.timerDisplay.classList.add('hidden');
        els.overtimeDisplay.classList.remove('hidden');

        // 3. Fade in TIME UP
        // (Handled by CSS animation classes or natural opacity if we added it)
        // Adding a slight delay or just let it pop if "calm" isn't prioritized for "TIME UP" 
        // But proposal said "Dissolve".
    }, 300);

    // Background Pulse
    els.body.classList.add('bg-red-950'); // Deep red background
    els.ambientGlow.classList.add('bg-red-600/20', 'animate-pulse-slow');
}

function exitOvertime() {
    isOvertime = false;

    // Reset Background
    els.body.classList.remove('bg-red-950');
    els.ambientGlow.classList.remove('bg-red-600/20', 'animate-pulse-slow');

    // Reset Display
    els.overtimeDisplay.classList.add('hidden');
    els.timerDisplay.classList.remove('hidden');

    requestAnimationFrame(() => {
        els.timerDisplay.style.opacity = '1';
    });
}

function updateGlow(level) {
    if (isOvertime) return; // Overtime handles its own glow

    // Reset base classes
    els.ambientGlow.className = 'absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out pointer-events-none';

    if (level === 'CRITICAL') {
        els.ambientGlow.classList.add('bg-accent/40', 'opacity-100', 'animate-pulse');
    } else if (level === 'GENTLE') {
        els.ambientGlow.classList.add('bg-yellow-500/20', 'opacity-100');
    } else {
        els.ambientGlow.classList.add('opacity-0');
    }
}

// Escape Key Handling (Return to Dashboard)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.electronAPI.sendViewerEscape();
    }
});

// Initial Fit Text (Simple version for now, Tailwind vw handles most)
function fitText() {
    // Optional: Dynamic check if text overflows
}
