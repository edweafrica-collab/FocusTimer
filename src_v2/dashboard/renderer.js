const timer = new CueTime();

// UI Elements
const els = {
    // Timer & Controls
    timerContainer: document.getElementById('timer-container'),
    timeReadout: document.getElementById('main-timer'),
    timeInput: document.getElementById('manual-time-input'),
    overtimeIndicator: document.getElementById('overtime-indicator'),

    // Buttons
    btnStart: document.getElementById('btn-start'),
    btnStartIcon: document.getElementById('btn-start-icon'),
    btnStartText: document.getElementById('btn-start-text'),
    btnReset: document.getElementById('btn-reset'),
    btnShowViewer: document.getElementById('btn-show-viewer'),
    presetBtns: document.querySelectorAll('.preset-btn'),

    // Inputs
    sessionTitleInput: document.getElementById('session-title-input'),

    // Status Indicators
    connectionStatus: document.getElementById('connection-status'),
    connectionDot: document.getElementById('connection-dot'),

    // Feature Panels - Event Schedule
    eventsContainer: document.getElementById('events-container'),
    emptyState: document.getElementById('empty-state'),
    btnAddEvent: document.getElementById('btn-add-event'),
    autoAdvanceToggle: document.getElementById('auto-advance-toggle'),

    // Modals
    eventModal: document.getElementById('event-modal'),
    eventForm: document.getElementById('event-form'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    modalTitle: document.getElementById('modal-title'),

    // Warning Modal
    warningModal: document.getElementById('warning-modal'),
    btnCancelWarning: document.getElementById('btn-cancel-warning'),
    btnConfirmWarning: document.getElementById('btn-confirm-warning'),

    // Next Event Modal
    nextEventModal: document.getElementById('next-event-modal'),
    btnStayEvent: document.getElementById('btn-stay-event'),
    btnProceedEvent: document.getElementById('btn-proceed-event'),
    nextEventTitle: document.getElementById('next-event-title'),
    nextEventDuration: document.getElementById('next-event-duration'),

    // Delete Modal
    deleteEventModal: document.getElementById('delete-event-modal'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    deleteEventTitle: document.getElementById('delete-event-title'),

    // New Screen Modal
    newScreenModal: document.getElementById('new-screen-modal'),
    btnIgnoreScreen: document.getElementById('btn-ignore-screen'),
    btnLaunchScreen: document.getElementById('btn-launch-screen'),
    newScreenLabel: document.getElementById('new-screen-label')
};

// State
let sessionTitle = "";
let editingEventId = null;

// ===== EVENT SCHEDULE STATE MANAGER =====
const EventSchedule = {
    events: [],
    activeEventId: null,
    autoAdvance: true,
    nextId: 1,

    // Create new event
    addEvent(eventData) {
        const event = {
            id: `event-${this.nextId++}`,
            title: eventData.title,
            duration: eventData.duration * 60 * 1000, // Convert minutes to ms
            speaker: eventData.speaker || '',
            notes: eventData.notes || '',
            status: 'pending',
            createdAt: Date.now()
        };
        this.events.push(event);
        return event;
    },

    // Insert event at specific position
    insertEvent(eventData, index) {
        const event = {
            id: `event-${this.nextId++}`,
            title: eventData.title,
            duration: eventData.duration * 60 * 1000,
            speaker: eventData.speaker || '',
            notes: eventData.notes || '',
            status: 'pending',
            createdAt: Date.now()
        };
        this.events.splice(index, 0, event);
        return event;
    },

    // Update existing event
    updateEvent(id, updates) {
        const event = this.events.find(e => e.id === id);
        if (event) {
            Object.assign(event, updates);
            if (updates.duration) {
                event.duration = updates.duration * 60 * 1000;
            }
        }
        return event;
    },

    // Delete event
    deleteEvent(id) {
        const index = this.events.findIndex(e => e.id === id);
        if (index !== -1) {
            this.events.splice(index, 1);
            if (this.activeEventId === id) {
                this.activeEventId = null;
            }
            return true;
        }
        return false;
    },

    // Get event by ID
    getEvent(id) {
        return this.events.find(e => e.id === id);
    },

    // Set active event
    setActive(id) {
        // Mark previous active as completed
        if (this.activeEventId) {
            const prev = this.getEvent(this.activeEventId);
            if (prev) prev.status = 'completed';
        }

        this.activeEventId = id;
        const event = this.getEvent(id);
        if (event) {
            event.status = 'active';
        }
    },

    // Complete active event
    completeActive() {
        if (this.activeEventId) {
            const event = this.getEvent(this.activeEventId);
            if (event) {
                event.status = 'completed';
            }
            this.activeEventId = null;
        }
    },

    // Get next pending event
    getNextPending() {
        return this.events.find(e => e.status === 'pending');
    },

    // Format duration for display (ms to HH:MM:SS)
    formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
};

// ===== EVENT RENDERING FUNCTIONS =====
function renderEvents() {
    if (EventSchedule.events.length === 0) {
        els.emptyState.classList.remove('hidden');
        els.eventsContainer.innerHTML = '';
        els.eventsContainer.appendChild(els.emptyState);
        return;
    }

    els.emptyState.classList.add('hidden');
    els.eventsContainer.innerHTML = '';

    EventSchedule.events.forEach((event, index) => {
        // Add event card
        const card = renderEventCard(event, index);
        els.eventsContainer.appendChild(card);
    });
}

// Event Delegation Handler
function handleEventAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    e.stopPropagation();
    const action = btn.dataset.action;

    // Handle Insert (which has data-index but no eventId)
    if (action === 'insert') {
        const index = parseInt(btn.dataset.index);
        openModal(index);
        return;
    }

    // Handle Card Actions (require eventId)
    const card = btn.closest('.group');
    if (!card) return;

    const eventId = card.dataset.eventId;
    const event = EventSchedule.getEvent(eventId);
    if (!event) return;

    switch (action) {
        case 'start':
            startEvent(eventId);
            break;
        case 'pause':
            if (timer.status === 'RUNNING') {
                timer.pause();
            } else {
                timer.start();
            }
            break;
        case 'edit':
            openModal(eventId);
            break;
        case 'delete':
            showDeleteModal(eventId);
            break;
    }
}

function renderEventCard(event, index) {
    const card = document.createElement('div');
    // Using new brand colors: surface-dark, primary border, etc.
    const isActive = event.status === 'active';
    const isCompleted = event.status === 'completed';
    const isPaused = timer.status === 'PAUSED' && isActive; // Check global pause state for active event

    // Base classes
    let classes = 'group relative rounded-xl p-4 flex items-center gap-4 transition-all mb-2 border cursor-grab active:cursor-grabbing ';

    if (isActive) {
        classes += 'bg-surface-dark border-l-4 border-l-primary border-y border-r border-zinc-800 shadow-lg';
    } else if (isCompleted) {
        classes += 'bg-zinc-900/40 border-zinc-800 opacity-60 hover:opacity-100';
    } else {
        classes += 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700';
    }

    card.className = classes;
    card.dataset.eventId = event.id;
    card.dataset.index = index; // For Drag/Drop

    // Draggable Attributes
    card.draggable = true;

    // Drag Events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);

    // Icon or number
    const iconDiv = document.createElement('div');
    if (isActive) {
        // Active Event Icon: Changed from 'play_arrow' to 'graphic_eq' (timeline/activity)
        iconDiv.className = `size-10 rounded-full flex items-center justify-center transition-colors ${isPaused ? 'bg-zinc-700 text-zinc-300' : 'bg-primary/20 text-primary'}`;
        iconDiv.innerHTML = `<span class="material-symbols-outlined">graphic_eq</span>`;
    } else if (isCompleted) {
        iconDiv.className = 'size-10 rounded-full bg-green-900/20 border border-green-900/50 flex items-center justify-center text-green-500';
        iconDiv.innerHTML = '<span class="material-symbols-outlined">check</span>';
    } else {
        iconDiv.className = 'size-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 font-timer text-sm font-bold group-hover:bg-zinc-700 transition-colors';
        iconDiv.textContent = (index + 1).toString().padStart(2, '0');
    }
    card.appendChild(iconDiv);

    // Content
    const content = document.createElement('div');
    content.className = 'flex-1 min-w-0';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-baseline justify-between mb-0.5';

    const title = document.createElement('h4');
    title.className = `font-${isActive ? 'bold text-white text-lg' : 'medium text-zinc-300 group-hover:text-white transition-colors'}`;
    title.textContent = event.title;
    titleRow.appendChild(title);

    const duration = document.createElement('span');
    duration.className = `font-timer ${isActive ? 'text-primary font-bold text-lg' : 'text-zinc-500 group-hover:text-zinc-300'} tracking-wide`;
    duration.textContent = EventSchedule.formatDuration(event.duration);
    titleRow.appendChild(duration);

    content.appendChild(titleRow);

    if (event.speaker) {
        const meta = document.createElement('div');
        meta.className = 'flex items-center gap-2 text-xs text-zinc-500 group-hover:text-zinc-400';

        const speaker = document.createElement('span');
        speaker.textContent = event.speaker;
        meta.appendChild(speaker);

        content.appendChild(meta);
    }

    card.appendChild(content);

    // Actions
    const actions = document.createElement('div');
    actions.className = `flex items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`;

    if (event.status === 'pending' || isCompleted) {
        actions.innerHTML = `
            <button class="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors" title="${isCompleted ? 'Restart Event' : 'Start Event'}" data-action="start">
                <span class="material-symbols-outlined text-xl">${isCompleted ? 'replay' : 'play_circle'}</span>
            </button>
            <button class="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Edit" data-action="edit">
                <span class="material-symbols-outlined text-xl">edit</span>
            </button>
            <button class="p-2 hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors" title="Delete" data-action="delete">
                <span class="material-symbols-outlined text-xl">delete</span>
            </button>
        `;
    } else if (isActive) {
        actions.innerHTML = `
            <button class="p-2 hover:bg-zinc-700 rounded-lg ${isPaused ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-400 hover:text-white'} transition-colors" title="${isPaused ? 'Resume' : 'Pause'}" data-action="pause">
                <span class="material-symbols-outlined text-xl">${isPaused ? 'play_arrow' : 'pause_circle'}</span>
            </button>
            <button class="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Edit" data-action="edit">
                <span class="material-symbols-outlined text-xl">edit</span>
            </button>
        `;
    }

    card.appendChild(actions);

    // Hover Insert Icon (Between cards)
    // We append it to the card but style it to appear below
    // Exception: Don't show on last card? User said "only the very last event... wouldn't have that icon".
    // Wait, "between that event and the one below". So every card except last has one below it.
    if (index < EventSchedule.events.length - 1) {
        const hoverInsert = document.createElement('div');
        hoverInsert.className = 'absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer';
        hoverInsert.innerHTML = `
            <div class="bg-zinc-800 text-zinc-400 hover:text-white hover:bg-primary hover:border-primary border border-zinc-600 rounded-full p-1 shadow-lg transform transition-transform hover:scale-110" title="Insert Event Here" data-action="insert" data-index="${index + 1}">
                <span class="material-symbols-outlined text-[16px] block pointer-events-none">add</span>
            </div>
        `;
        // Listener removed in favor of delegation
        card.appendChild(hoverInsert);
    }

    // Setup action listeners REMOVED (Delegation)

    return card;
}

// setupEventCardListeners function REMOVED

function startEvent(eventId) {
    const event = EventSchedule.getEvent(eventId);
    if (!event) return;

    EventSchedule.setActive(eventId);
    timer.setDuration(event.duration / 60000); // Convert ms to minutes
    timer.start();
    renderEvents();
}

let nextEventIdToStart = null;

function showNextEventModal(nextEvent) {
    els.nextEventTitle.textContent = nextEvent.title;
    els.nextEventDuration.textContent = EventSchedule.formatDuration(nextEvent.duration);
    nextEventIdToStart = nextEvent.id;
    els.nextEventModal.showModal();
}

function closeNextEventModal() {
    els.nextEventModal.close();
    nextEventIdToStart = null;
}

// Delete Modal Logic
let eventIdToDelete = null;

function showDeleteModal(eventId) {
    eventIdToDelete = eventId;
    const event = EventSchedule.getEvent(eventId);
    els.deleteEventTitle.textContent = event ? event.title : 'Event';
    els.deleteEventModal.showModal();
}

function closeDeleteModal() {
    els.deleteEventModal.close();
    eventIdToDelete = null;
}

function init() {
    // 1. Timer Callbacks
    timer.callbacks.onTick = (timeStr, ms, warningLevel) => {
        updateDisplay(timeStr, warningLevel);
        broadcastState();
    };

    timer.callbacks.onStatusChange = (state) => {
        updateDisplay(state.timeStr, state.warningLevel); // Ensure display syncs with state changes (Presets, Reset, etc.)
        updateControls(state.status);
        broadcastState();
    };

    // Timer completion callback for auto-advance
    // Timer completion callback for auto-advance
    timer.callbacks.onComplete = () => {
        if (EventSchedule.activeEventId) {
            EventSchedule.completeActive();
            // renderEvents(); // Update "Completed" status immediately? 
            // Warning: If we re-render, the card changes to "Completed" (Green check). 
            // But we are still in "Overtime" visually on the timer until user decides.
            // Let's re-render to show progress.
            renderEvents();

            const nextEvent = EventSchedule.getNextPending();

            if (nextEvent) {
                // Show Confirmation Modal instad of Auto-start
                showNextEventModal(nextEvent);
            }
            // If no next event, we just stay here (Overtime).
        }
    };

    // 2. Button Listeners
    els.btnStart.addEventListener('click', () => {
        if (timer.status === 'RUNNING') {
            timer.pause();
        } else {
            startSequence();
        }
    });

    els.btnReset.addEventListener('click', () => {
        timer.stop();
        timer.totalDuration = 0;
        timer.remaining = 0;
        timer.warningLevel = null;

        cancelManualTime(); // Ensure input closes if open

        // Force display update immediately
        updateDisplay("00:00", null);

        timer.emitUpdate(); // Force 00:00:00 state broadcast
        broadcastState(); // Ensure viewer resets
    });

    // Manual Time Input Toggle
    els.timerContainer.addEventListener('click', (e) => {
        if (timer.status === 'RUNNING') return; // Don't edit while running

        // If clicking the input itself, don't re-init
        if (e.target === els.timeInput) return;

        els.timeReadout.classList.add('invisible');
        els.timeInput.classList.remove('hidden');
        els.timeInput.focus();

        // Set value to current formatted time
        els.timeInput.value = timer.formatTime(timer.remaining);
        els.timeInput.select(); // Select all text for easy replacement
    });

    // Handle Manual Input Submit
    els.timeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            commitManualTime();
            startSequence(); // Auto-start on Enter
        } else if (e.key === 'Escape') {
            cancelManualTime();
        }
    });

    els.timeInput.addEventListener('blur', () => {
        commitManualTime();
    });

    // Show Viewer Button
    if (els.btnShowViewer) {
        els.btnShowViewer.addEventListener('click', async () => {
            const screens = await window.electronAPI.getScreens();
            if (screens.length > 1) {
                // Find potential secondary display (non-zero position) or just take the second one
                const secondary = screens.find(s => s.bounds.x !== 0 || s.bounds.y !== 0) || screens[1];

                window.electronAPI.restoreZOrder(); // Restore Z-order before launching
                window.electronAPI.launchViewer(secondary.id);
            } else {
                window.electronAPI.restoreZOrder();
                window.electronAPI.launchViewer(screens[0].id);
            }
        });
    }

    els.presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const min = parseFloat(btn.dataset.time); // Support floats (0.5 for 30s)
            const msToAdd = min * 60 * 1000;

            if (timer.status === 'IDLE' && timer.remaining <= 0) {
                if (min > 0) timer.setDuration(min); // setDuration handles float mins -> ms? 
                // Wait, timer.setDuration(mins) uses mins * 60 * 1000. So 0.5 works.
            } else {
                timer.remaining += msToAdd;
                // Allow going negative if subtracting? 
                // "add some preset seconds addition and substration"
                // Usually subtraction shouldn't go below 0 unless it's overtime adjustment?
                // Let's keep existing logic: if < 0 -> 0.
                // UNLESS we are in overtime, where remaining is already <= 0?
                // If remaining is -10000 (10s overtime), and we add +30s (+30000), it becomes +20000 (20s remaining).
                // If remaining is -10000 and we subtract -30s (-30000), it becomes -40000.

                // Existing logic:
                // if (timer.remaining < 0) timer.remaining = 0; 
                // This prevents overtime from getting deeper? Or prevents it from staying negative?
                // If I am in overtime (-10s) and I click +1m, I want to extend.
                // -10s + 60s = 50s. Correct.

                // But my previous code had `if (timer.remaining < 0) timer.remaining = 0;`??
                // Let's check Step 27 line 450: `if (timer.remaining < 0) timer.remaining = 0;`
                // This PREVENTS negative time/overtime tracking if we subtract too much?
                // OR if we are just adding time?

                // If I am at 10s and subtract 30s (-20s). It sets to 0. 
                // That seems safe for "during countdown".
                // If I am in overtime (-10) and subtract 30s -> -40.
                // The existing logic CLEARS overtime. 
                // Does the user want that? "add some preset seconds addition and substration".
                // Usually operators want to adjust remaining time.
                // I will keep the clamp at 0 for now to avoid confusion unless requested.
                // Actually, if we are already in overtime, we might want to adjust how DEEP we are?
                // But "Remaining" usually implies positive.

                // Let's stick to simple clamp for now.
                if (timer.remaining < 0) timer.remaining = 0;
                timer.emitUpdate(); // Force update display
            }
        });
    });

    // 3. Session Title Logic (Sync on Enter)
    els.sessionTitleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sessionTitle = els.sessionTitleInput.value.trim();
            broadcastState();
            els.sessionTitleInput.blur();
        }
    });

    // 4. Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (timer.status === 'RUNNING') timer.pause();
            else startSequence();
        }
    });

    // 5. Initial Checks
    checkScreens();

    // Event Delegation
    els.eventsContainer.addEventListener('click', handleEventAction);

    // 6. Modal Handlers
    els.btnAddEvent.addEventListener('click', () => openModal());
    els.btnCloseModal.addEventListener('click', closeModal);
    els.btnCancelModal.addEventListener('click', closeModal);
    els.eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(els.eventForm);
        const data = {
            title: formData.get('title'),
            duration: parseInt(formData.get('duration')),
            speaker: formData.get('speaker')
        };

        if (editingEventId) {
            EventSchedule.updateEvent(editingEventId, data);
        } else if (insertionIndex !== null) {
            EventSchedule.insertEvent(data, insertionIndex);
        } else {
            EventSchedule.addEvent(data);
        }

        renderEvents();
        closeModal();
    });

    // 7. Initial Event Render
    renderEvents();

    // 8. Warning Modal Listeners
    els.btnCancelWarning.addEventListener('click', closeWarningModal);
    els.btnConfirmWarning.addEventListener('click', () => {
        closeWarningModal();
        finalizeStart();
    });

    // 9. Next Event Modal Listeners
    els.btnStayEvent.addEventListener('click', closeNextEventModal);
    els.btnProceedEvent.addEventListener('click', () => {
        if (nextEventIdToStart) {
            startEvent(nextEventIdToStart);
        }
        closeNextEventModal();
    });

    // 10. Delete Modal Listeners
    els.btnCancelDelete.addEventListener('click', closeDeleteModal);
    els.btnConfirmDelete.addEventListener('click', () => {
        if (eventIdToDelete) {
            // Check if we are deleting the ACTIVE event
            if (EventSchedule.activeEventId === eventIdToDelete) {
                // Find next event BEFORE deleting
                const currentEvent = EventSchedule.getEvent(eventIdToDelete);
                const currentIndex = EventSchedule.events.indexOf(currentEvent);
                const nextEvent = EventSchedule.events[currentIndex + 1];

                // Delete the current one
                EventSchedule.deleteEvent(eventIdToDelete);

                if (nextEvent) {
                    // Start next event immediately
                    startEvent(nextEvent.id);
                } else {
                    // No next event -> Reset to Idle
                    timer.stop();
                    timer.remaining = 0;
                    timer.totalDuration = 0;
                    updateDisplay("00:00", null);
                    timer.emitUpdate();
                    broadcastState();
                }
                renderEvents();
            } else {
                // Deleting inactive/pending/completed event
                if (EventSchedule.deleteEvent(eventIdToDelete)) {
                    renderEvents();
                }
            }
        }
        closeDeleteModal();
    });

    // 11. Screen Detection Listener
    window.electronAPI.onDisplayDetected((newDisplay) => {
        console.log('[Renderer] Handling Display Detected:', newDisplay);
        // Show modal asking to launch viewer
        els.newScreenLabel.textContent = newDisplay.label || `Display ${newDisplay.id}`;

        // Handle Ignore
        els.btnIgnoreScreen.onclick = () => {
            window.electronAPI.restoreZOrder();
            els.newScreenModal.close();
        };

        // Handle Launch
        els.btnLaunchScreen.onclick = () => {
            // Launch on this specific display
            window.electronAPI.restoreZOrder(); // Reset Z before launching (launch will set Viewer alwaysOnTop anyway)
            window.electronAPI.launchViewer(newDisplay.id);
            els.newScreenModal.close();
        };

        els.newScreenModal.showModal();
    });
}

// Logic Helpers
function commitManualTime() {
    const val = els.timeInput.value.trim();
    if (!val) {
        cancelManualTime();
        return;
    }

    // Parse logic:
    // If plain number: Minutes (Legacy/Quick entry)
    // If contains colon: HH:MM:SS or MM:SS

    let totalSeconds = 0;

    if (val.includes(':')) {
        const parts = val.split(':').map(p => parseInt(p) || 0);

        if (parts.length === 3) {
            // HH:MM:SS
            totalSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        } else if (parts.length === 2) {
            // MM:SS (Standard timer behavior)
            // User asked for "Hours and Min". Ambiguity: "1:30" usually 1m30s.
            // But if user typed "90", that's 90 mins.
            // Let's stick to standard MM:SS for 2 parts, unless input > 60 in first part?
            // Actually, if I type "1:00", I expect 1 min.
            // If I want 1 hour, I type "60" or "1:00:00".
            totalSeconds = (parts[0] * 60) + parts[1];
        } else {
            // Unexpected, treat as minutes
            totalSeconds = parts[0] * 60;
        }
    } else {
        // Plain number -> Minutes
        const num = parseFloat(val);
        if (!isNaN(num)) {
            totalSeconds = num * 60;
        }
    }

    if (totalSeconds >= 0) {
        timer.setDurationSeconds(totalSeconds);
    }
    cancelManualTime();
}

function cancelManualTime() {
    els.timeInput.classList.add('hidden');
    els.timeReadout.classList.remove('invisible');
    els.timeReadout.classList.remove('hidden'); // Safety clean up
}

let insertionIndex = null;

function openModal(identifier = null) {
    els.eventForm.reset();

    if (typeof identifier === 'string') {
        // EDIT MODE
        editingEventId = identifier;
        insertionIndex = null;

        const event = EventSchedule.getEvent(identifier);
        els.modalTitle.textContent = 'Edit Event';
        els.eventForm.querySelector('[name="title"]').value = event.title;
        els.eventForm.querySelector('[name="duration"]').value = event.duration / 60000;
        els.eventForm.querySelector('[name="speaker"]').value = event.speaker;
    } else if (typeof identifier === 'number') {
        // INSERT MODE
        editingEventId = null;
        insertionIndex = identifier;
        els.modalTitle.textContent = 'Insert Event';
    } else {
        // ADD MODE (Default)
        editingEventId = null;
        insertionIndex = null;
        els.modalTitle.textContent = 'Add New Event';
    }

    els.eventModal.showModal();
}

function closeModal() {
    els.eventModal.close();
    editingEventId = null;
    insertionIndex = null;
}

// Logic Helpers
async function startSequence() {
    if (timer.status === 'RUNNING') return;

    const screens = await window.electronAPI.getScreens();

    // Single Screen Check
    if (screens.length === 1) {
        showWarningModal();
        return;
    }

    // If multi-screen, proceed immediately
    finalizeStart(screens);
}

function showWarningModal() {
    els.warningModal.showModal();
    // Auto-focus confirm button so Enter works
    els.btnConfirmWarning.focus();
}

function closeWarningModal() {
    els.warningModal.close();
}

async function finalizeStart(screens = null) {
    if (!screens) {
        screens = await window.electronAPI.getScreens();
    }

    // Launch Viewer logic
    if (screens.length > 1) {
        // Find potential secondary display (non-zero position) or just take the second one
        const secondary = screens.find(s => s.bounds.x !== 0 || s.bounds.y !== 0) || screens[1];

        window.electronAPI.restoreZOrder();
        window.electronAPI.launchViewer(secondary.id);
    } else {
        // Single screen mode - launch on primary
        window.electronAPI.launchViewer(screens[0].id);
    }

    // CRITICAL: Ensure timer starts AFTER viewer launch logic is triggered
    timer.start();
}

function updateDisplay(timeStr, warningLevel) {
    els.timeReadout.textContent = timeStr;

    // Reset classes
    els.timeReadout.className = 'font-timer text-[7rem] leading-none font-bold tracking-tighter text-white tabular-nums select-none transition-all timer-glow';

    // Apply new Logic

    // Always clear pulse first
    els.timerContainer.classList.remove('animate-pulse-red');

    if (warningLevel === 'CRITICAL' || warningLevel === 'OVERTIME') {
        // Red Breathing & Overtime Header
        els.timeReadout.classList.remove('text-white', 'timer-glow');
        els.timeReadout.classList.add('text-breathe-red');

        // Let's strictly show "OVERTIME" only if timer.remaining <= 0.
        if (timer.remaining <= 0) {
            els.overtimeIndicator.classList.remove('hidden');

            // Add background pulse
            els.timerContainer.classList.add('animate-pulse-red');

            // Format Negative (-MM:SS) if not already present
            if (!timeStr.startsWith('-')) {
                els.timeReadout.textContent = '-' + timeStr;
            }
        } else {
            els.overtimeIndicator.classList.add('hidden');
        }

    } else if (warningLevel === 'GENTLE') {
        // Amber Breathing display
        els.timeReadout.classList.remove('text-white', 'timer-glow');
        els.timeReadout.classList.add('text-breathe-amber');
        els.overtimeIndicator.classList.add('hidden');
    } else {
        // Normal White
        els.timeReadout.classList.add('text-white', 'timer-glow');
        els.overtimeIndicator.classList.add('hidden');
    }
}

function updateControls(status) {
    if (status === 'RUNNING') {
        els.btnStartIcon.textContent = 'pause';
        els.btnStartText.textContent = 'Pause';
        els.btnStart.classList.add('bg-zinc-700', 'text-white'); // Dimmed style for pause
        els.btnStart.classList.remove('bg-primary', 'text-white');

        // Pause Icon active state can be handled here if we had a specific pause icon element separate from start button
        // Current requirement: "Pause icon on the right should also have an active state"
        // Wait, the "Pause icon on the right" refers to the actions inside the Event Card? Or the main controls?
        // User said "The pause icon on the right". That usually means the Action column in the event list.
        // We handle that in renderEventCard.

    } else {
        els.btnStartIcon.textContent = 'play_arrow';
        els.btnStartText.textContent = 'Start';
        els.btnStart.classList.remove('bg-zinc-700', 'text-white');
        els.btnStart.classList.add('bg-primary', 'text-white');
    }

    // Update Right-Hand Side Play/Pause buttons in the list if they exist
    // This ensures that if we pause/play via Spacebar or Main Button, the list buttons sync up.
    // We can do this by re-rendering events, but that might be heavy if dragging.
    // Better: Select the active action button and update it.
    if (EventSchedule.activeEventId) {
        // Find the active card
        const activeCard = document.querySelector(`[data-event-id="${EventSchedule.activeEventId}"]`);
        if (activeCard) {
            const pauseBtn = activeCard.querySelector('[data-action="pause"]');
            if (pauseBtn) {
                // Sync with global status
                const isPaused = status !== 'RUNNING'; // IDLE, PAUSED, OVERTIME all imply "Not Running"
                // Wait, if OVERTIME, we are RUNNING? 
                // timer.status = 'RUNNING' even in overtime? Yes, usually.
                // Let's check logic: isPaused = (status === 'PAUSED');
                const pausedState = (status === 'PAUSED');

                const iconSpan = pauseBtn.querySelector('span');
                if (pausedState) {
                    // Show Resume (Play)
                    iconSpan.textContent = 'play_arrow';
                    pauseBtn.title = 'Resume';
                    pauseBtn.classList.add('text-yellow-400', 'bg-yellow-400/10');
                    pauseBtn.classList.remove('text-zinc-400', 'hover:text-white');

                    // Also update left icon if we want?
                    // The renderEventCard does it. Re-rendering might be safer but leads to flicker?
                    // Let's just re-render to be safe and consistent since `renderEventCard` has the logic.
                    // renderEvents(); // REMOVED to prevent loop/flicker. The button update below is enough for now, 
                    // or let renderEvents handle it if status changes trigger it.
                    // Actually, onStatusChange calls updateControls. If updateControls calls renderEvents, 
                    // and renderEvents re-creates buttons... it might be okay, but inefficient.
                    // Let's rely on renderEvents for the Left Icon, but update specific button here?
                    // "renderEventCard" uses isPaused to set class.

                    // If we don't call renderEvents, the LEFT icon (status icon) won't update.
                    // Let's call renderEvents() but be careful.
                    renderEvents();
                } else {
                    // Show Pause
                    // iconSpan.textContent = 'pause_circle';
                    // pauseBtn.title = 'Pause';
                    // But re-rendering handles "Active" classes and styles best.
                    renderEvents();
                }
            }
        }
    }
}

function broadcastState() {
    // Determine what title/speaker to show
    // Priority: Active Event > Auto Title > Empty
    let displayTitle = sessionTitle;
    let displaySpeaker = "";

    if (EventSchedule.activeEventId) {
        const event = EventSchedule.getEvent(EventSchedule.activeEventId);
        if (event) {
            displayTitle = event.title;
            displaySpeaker = event.speaker;
        }
    }

    const state = {
        timeStr: timer.formatTime(timer.remaining),
        remaining: timer.remaining,
        status: timer.status,
        warningLevel: timer.warningLevel,
        sessionTitle: displayTitle,
        speaker: displaySpeaker,
        isOvertime: timer.remaining <= 0
    };
    window.electronAPI.sendTimerUpdate(state);
}

async function checkScreens() {
    const screens = await window.electronAPI.getScreens();
    if (screens.length > 1) {
        els.connectionStatus.textContent = 'Connected';
        els.connectionStatus.classList.add('text-primary');
        els.connectionStatus.classList.remove('text-zinc-600');

        els.connectionDot.classList.add('bg-primary', 'animate-pulse'); // Pulse effect
        els.connectionDot.classList.remove('bg-zinc-600');
    } else {
        els.connectionStatus.textContent = 'Single Display';
        els.connectionStatus.classList.remove('text-primary');
        els.connectionStatus.classList.add('text-zinc-600');

        els.connectionDot.classList.remove('bg-primary', 'animate-pulse');
        els.connectionDot.classList.add('bg-zinc-600');
    }
}

// ===== DRAG & DROP HANDLERS =====
let dragSrcEl = null;

function handleDragStart(e) {
    this.style.opacity = '0.4';
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('border-primary', 'border-dashed');
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    els.eventsContainer.querySelectorAll('.group').forEach(item => {
        item.classList.remove('border-primary', 'border-dashed');
    });
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (dragSrcEl !== this) {
        const srcIndex = parseInt(dragSrcEl.dataset.index);
        const targetIndex = parseInt(this.dataset.index);

        // Reorder events array
        const movedItem = EventSchedule.events.splice(srcIndex, 1)[0];
        EventSchedule.events.splice(targetIndex, 0, movedItem);

        renderEvents();
    }
    return false;
}

// Start
init();
