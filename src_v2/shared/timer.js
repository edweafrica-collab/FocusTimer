const WARNING_THRESHOLDS = {
    LONG: 7,
    MEDIUM: 3,
    SHORT: 2,
    TINY: 1
};

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
                // Trigger completion callback on first transition to zero
                if (this.warningLevel !== 'OVERTIME') {
                    this.warningLevel = 'OVERTIME';
                    this.callbacks.onWarning('OVERTIME');

                    // Trigger onComplete callback if defined
                    if (this.callbacks.onComplete) {
                        this.callbacks.onComplete();
                    }
                }
            } else {
                this.checkWarnings();
            }
        }
        this.callbacks.onTick(this.formatTime(this.remaining), this.remaining, this.warningLevel);
    }

    checkWarnings() {
        // User Logic Implementation:
        // 1. > 20 mins: Warn at 7 mins (GENTLE), Critical at ? (Assume standard 1m)
        // 2. 10 - 20 mins: Warn at ~3-5 mins (Let's stick to 3m for safety)
        // 3. 5 - 10 mins: Warn at 2 mins
        // 4. < 5 mins: Warn at 1 min

        // "Mask Effect" Logic in CSS handles the visual fade in/out. 
        // We just need to trigger the state.

        const totalMinutes = this.totalDuration / 60000;
        const remainingMinutes = this.remaining / 60000;
        const remSecs = this.remaining / 1000;

        let nextLevel = 'NONE';

        if (this.remaining <= 0) {
            nextLevel = 'OVERTIME';
        } else {
            // Determine Threshold based on Total Duration Tier
            let gentleThresholdMin = 0;

            if (totalMinutes >= 20) {
                gentleThresholdMin = WARNING_THRESHOLDS.LONG;
            } else if (totalMinutes >= 10) {
                gentleThresholdMin = WARNING_THRESHOLDS.MEDIUM;
            } else if (totalMinutes >= 5) {
                gentleThresholdMin = WARNING_THRESHOLDS.SHORT;
            } else {
                // Short talks (< 5m)
                gentleThresholdMin = WARNING_THRESHOLDS.TINY;
            }

            // Critical Threshold (Final Countdown) - Standardizing at 1 min or 30s
            // User visual: "Full red background... fades from red to black"
            // Let's set Critical at 1 minute generally
            let criticalThresholdMin = 1;
            if (totalMinutes < 2) criticalThresholdMin = 0.5; // 30s for tiny talks

            if (remainingMinutes <= criticalThresholdMin) {
                nextLevel = 'CRITICAL';
            } else if (remainingMinutes <= gentleThresholdMin) {
                nextLevel = 'GENTLE';
            }
        }

        if (this.warningLevel !== nextLevel) {
            this.warningLevel = nextLevel;
            this.callbacks.onWarning(nextLevel);
        }
    }

    // calculateWarningThreshold removed as it's replaced by explicit tier logic above

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
