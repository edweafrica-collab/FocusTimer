const els = {
    timerDisplay: document.getElementById('timer-display'),
    overtimeDisplay: document.getElementById('overtime-display'),
    sessionTitle: document.getElementById('session-title'),
    currentSpeaker: document.getElementById('current-speaker'),
    ambientGlow: document.getElementById('ambient-glow'),
    body: document.getElementById('viewer-body'),
    timerContainer: document.getElementById('timer-container')
};

// State
let lastTitle = "";
let lastSpeaker = "";
let isOvertime = false;

// IPC Listeners
window.electronAPI.onTimerUpdate((state) => {
    updateUI(state);
});

function updateUI(state) {
    // 1. Session Title
    if (state.sessionTitle !== lastTitle) {
        setTextWithOverflow(els.sessionTitle, state.sessionTitle);
        lastTitle = state.sessionTitle;
    }

    // 2. Speaker Name
    if (state.speaker !== lastSpeaker) {
        setTextWithOverflow(els.currentSpeaker, state.speaker);
        lastSpeaker = state.speaker;
    }

    // 3. Timer / Overtime Logic
    if (state.isOvertime) {
        if (!isOvertime) {
            enterOvertime();
        }
    } else {
        if (isOvertime) {
            exitOvertime();
        }
        // Update timer text and fit
        els.timerDisplay.textContent = state.timeStr;
        fitTimerText(state.timeStr);
    }

    // 4. Warning States (Ambient Glow)
    updateGlow(state.warningLevel);
}

// Helper: Handle text update + overflow marquee
function setTextWithOverflow(element, text) {
    element.textContent = text || "";
    element.style.opacity = text ? "1" : "0";

    // Reset class to check width
    element.classList.remove('animate-marquee');

    // Allow render cycle to calculate width
    if (text) {
        requestAnimationFrame(() => {
            // If parent container is smaller than content
            if (element.scrollWidth > element.parentElement.clientWidth) {
                element.classList.add('animate-marquee');
            }
        });
    }
}

// Helper: Fit Timer Text (Prevent Overflow)
function fitTimerText(text) {
    const charCount = text.length;
    // Base size is 35vw (for 00:00 - 5 chars)
    // If we have hours (00:00:00 - 8 chars) or massive hours (120:00:00 - 9 chars)

    if (charCount > 5) {
        // Decrease size roughly proportional to length
        // 5 chars -> 35vw
        // 8 chars -> ~22vw
        // 9 chars -> ~19vw
        const newSize = Math.max(15, 35 - ((charCount - 5) * 5));
        els.timerDisplay.style.fontSize = `${newSize}vw`;
    } else {
        els.timerDisplay.style.fontSize = '35vw';
    }
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

    // Background Pulse (Classic Breathing Effect)
    // els.body.classList.add('bg-red-950'); // Removed static
    document.body.classList.add('overtime-mode');
}

function exitOvertime() {
    isOvertime = false;

    // Reset Background
    // els.body.classList.remove('bg-red-950');
    document.body.classList.remove('overtime-mode');
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

    // Apply Classic Warning Classes
    if (level === 'CRITICAL') {
        els.ambientGlow.classList.add('warning-critical');
    } else if (level === 'GENTLE') {
        els.ambientGlow.classList.add('warning-gentle');
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
