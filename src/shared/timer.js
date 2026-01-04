class FocusTimer {
    constructor() {
        this.totalDuration = 0; // ms
        this.remaining = 0; // ms
        this.status = 'IDLE'; // IDLE, RUNNING, PAUSED, OVERTIME
        this.startTime = 0;
        this.timerId = null;
        this.callbacks = {
            onTick: () => { },
            onStatusChange: () => { },
            onWarning: () => { }
        };

        // Warning configuration
        this.warningLevel = 'NONE'; // NONE, GENTLE, CRITICAL
    }

    setDuration(minutes) {
        this.totalDuration = minutes * 60 * 1000;
        this.remaining = this.totalDuration;
        this.status = 'IDLE';
        this.warningLevel = 'NONE';
        this.emitUpdate();
    }

    setDurationSeconds(seconds) {
        this.totalDuration = seconds * 1000;
        this.remaining = this.totalDuration;
        this.status = 'IDLE';
        this.warningLevel = 'NONE';
        this.emitUpdate();
    }

    start() {
        if (this.status === 'RUNNING') return;

        this.status = 'RUNNING';
        const now = Date.now();
        // If starting from IDLE, we just start.
        // If starting from PAUSED, we resume.

        this.lastTick = now;

        this.timerId = setInterval(() => {
            this.tick();
        }, 100); // 10Hz updates for smoothness, though 1s is display res
        this.emitUpdate();
    }

    pause() {
        if (this.status !== 'RUNNING') return;
        this.status = 'PAUSED';
        clearInterval(this.timerId);
        this.emitUpdate();
    }

    stop() {
        this.status = 'IDLE';
        this.remaining = this.totalDuration;
        this.warningLevel = 'NONE';
        clearInterval(this.timerId);
        this.emitUpdate();
    }

    tick() {
        const now = Date.now();
        const delta = now - this.lastTick;
        this.lastTick = now;

        if (this.status === 'RUNNING') {
            this.remaining -= delta;

            if (this.remaining <= 0) {
                // Switch to Overtime if not already
                // In Overtime, remaining becomes negative, indicating time passed since zero
                // We handle logic slightly differently or just let it go negative?
                // PRD says "Overtime: Timer replaced with TIME UP! ... Secondary display: negative count-up"
                // So we just let remaining go negative.
                if (this.warningLevel !== 'OVERTIME') {
                    this.warningLevel = 'OVERTIME';
                    this.callbacks.onWarning('OVERTIME');
                }
            } else {
                this.checkWarnings();
            }
        }
        this.callbacks.onTick(this.formatTime(this.remaining), this.remaining, this.warningLevel);
    }

    checkWarnings() {
        const warningThreshold = this.calculateWarningThreshold(); // ms

        // Critical warning (e.g., last 30s or 1 min depending on logic) - let's simplify for now based on PRD
        // PRD: "WarningTrigger = CLAMP(TotalTime × 0.15, Min=30s, Max=5m)"

        // The PRD specifies ONE warning logic trigger, implying "Gentle Warning".
        // "Critical Warning" is "Final moments". Let's say Critical is fixed at 30s or 10%? 
        // PRD Table: 
        // Gentle: pulsing orange. (Triggered by the formula)
        // Critical: pulsing red. (Final moments)

        const timeRemainingSeconds = this.remaining / 1000;
        const warningThresholdSeconds = warningThreshold / 1000;

        let nextLevel = 'NONE';

        if (timeRemainingSeconds <= 0) {
            nextLevel = 'OVERTIME';
        } else if (timeRemainingSeconds <= 30 && this.totalDuration > 60000) {
            // Critical at 30s left (if talk is > 1m)
            nextLevel = 'CRITICAL';
        } else if (timeRemainingSeconds <= 10 && this.totalDuration <= 60000) {
            // For short talks (<1m), critical is 10s
            nextLevel = 'CRITICAL';
        } else if (timeRemainingSeconds <= warningThresholdSeconds) {
            nextLevel = 'GENTLE';
        }

        if (this.warningLevel !== nextLevel) {
            this.warningLevel = nextLevel;
            this.callbacks.onWarning(nextLevel);
        }
    }

    calculateWarningThreshold() {
        const totalSeconds = this.totalDuration / 1000;
        let warningSeconds = totalSeconds * 0.15;

        // CLAMP(TotalTime * 0.15, Min=30s, Max=5m)
        if (warningSeconds < 30) warningSeconds = 30;
        if (warningSeconds > 300) warningSeconds = 300;

        // Edge case: If total time is very short (< 30s), trigger immediately? 
        // Or just ensure we don't warn before start.
        if (warningSeconds > totalSeconds) warningSeconds = totalSeconds / 2;

        return warningSeconds * 1000;
    }

    formatTime(ms) {
        const absMs = Math.abs(ms);
        const totalSeconds = Math.ceil(absMs / 1000); // 0.1s -> 1s display
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        const mStr = m.toString().padStart(2, '0');
        const sStr = s.toString().padStart(2, '0');

        if (h > 0) {
            return `${h}:${mStr}:${sStr}`;
        }
        return `${mStr}:${sStr}`;
    }

    emitUpdate() {
        this.callbacks.onStatusChange({
            status: this.status,
            remaining: this.remaining,
            timeStr: this.formatTime(this.remaining),
            totalDuration: this.totalDuration,
            warningLevel: this.warningLevel
        });
    }
}

if (typeof module !== 'undefined') {
    module.exports = FocusTimer;
}
