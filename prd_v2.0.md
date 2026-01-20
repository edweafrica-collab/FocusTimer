# FocusTimer Application - Product Requirements Document (v2.0)

**Version:** 2.0
**Date:** 2026-01-11
**Status:** Live (v1.1.6)

## 1. Product Overview
FocusTimer is a dual-window desktop application (Electron) designed for public speakers, event operators, and stage management. It provides a control dashboard for the operator and a clean, high-visibility countdown timer for the speaker/audience on a secondary display.

## 2. Core Architecture
- **Framework**: Electron (Main Process + 2 Renderer Processes)
- **State Management**: Shared internal state in `timer.js`, broadcasted to windows via IPC.
- **Persistence**: `session-state.json` (Note: Cleared on fresh launch via "Fresh Start" logic).

## 3. Key Features

### 3.1. Launch & Setup
- **Splash Screen**: On launch, a branded splash screen appears with a fade/shake entrance effect, transitioning automatically to the Operator Dashboard.
- **Fresh Start**: All previous session data is wiped on app launch to ensure a `00:00` clean state.
- **Multi-Screen Detection**:
    - **Auto-Launch**: If a secondary display is detected, the Viewer window launches automatically on it in fullscreen.
    - **Single-Screen Mode**: If only one display is found, a modal prompts the user to confirm launching the Viewer on the same screen.

### 3.2. Operator Dashboard
**UI Specifications:**
- **Dimensions**: Fixed size (`width: 600px`, `height: 920px`). Scrollable if content overflows.
- **Theme**: Dark Mode (Background `#121212`, Surface `#1E1E1E`).

**Controls & Functionality:**
- **Timer Readout**: Real-time display of remaining time.
    - **Instant Feedback**: Updates immediately upon Presets/Reset interactions (0ms latency).
- **Transport Controls**:
    - `START` (Green): Begins countdown. (Hidden while running).
    - `PAUSE` (Yellow): Pauses timer.
    - `STOP/RESET` (Red): Stops timer, resets to `00:00`, clears warnings, and **clears manual input fields**.
- **Quick Presets**: `5m`, `10m`, `15m`, `20m`, `30m`, `45m`, `60m`, `90m`.
    - **Additive Logic**: Clicking a preset *adds* that amount to the current remaining time.
- **Manual Input**: `Minutes` and `Seconds` input fields for custom duration.
    - **Keyboard Support**: Pressing `Enter` in these fields starts the timer.
- **Session Title Controls**:
    - **Session Title Input**: Text field for session name (e.g., "Keynote").
    - **SHOW Button**: Pushes the title to the Viewer screen.
    - **CLEAR Button**: Removes the title from the Viewer and clears the input.
    - *Note*: Title does NOT persist on app restart.
- **Adjust Controls**: `+1m`, `-1m` buttons for quick tweaks.
- **Show Viewer**: A button in the header to re-open the Viewer window if it was closed.
- **App Close Safety**: Use of a **Native System Dialog** when clicking "X" while the timer is running, forcing a distinct "Yes/No" choice to prevent accidental closure.

### 3.3. Viewer Mode (Speaker Display)
**Visual Specifications:**
- **Font**: **'Oswald'** (Google Fonts), Bold/Condensed weight (700/900).
- **Numerals**: Tabular (`font-variant-numeric: tabular-nums`) to prevent jitter.
- **Alignment**:
    - **Timer**: Absolute Center (`top: 50%`, `left: 50%`).
    - **Session Title**: Top Center (`top: 5%`, `font-size: 12vw`).
- **Background**: Pure Black (`#000000`) normally.

**States:**
1.  **Idle/Running**: White Text on Black Background.
2.  **Gentle Warning**: Orange border pulse (Triggered at 15% remaining).
3.  **Critical Warning**: Red border pulse (Triggered near end).
4.  **Overtime ("TIME UP!")**:
    - **Display**: "TIME UP!" text replaces numbers.
    - **Alignment**: Vertically Centered.
    - **Attractor Animation**: Background smoothly pulses between **Red** and **Black** (3s loop) to grab attention.

### 3.4. Shared Logic
- **Timer Class**: Handles tick logic (100ms resolution).
- **Status Broadcast**: Main Process acts as the hub, receiving updates from Dashboard and broadcasting to Viewer.

## 4. Change Log (v1.0.0 -> v2.0)
| Version | Change Summary |
| :--- | :--- |
| **v1.0.0** | Initial Release. Basic Timer, presets. |
| **v1.1.0** | Dashboard Height increase, Viewer Title fix. |
| **v1.1.1** | Absolute Centering for Viewer, IPC-based App Close. |
| **v1.1.2** | Robust Main Process Interception for "Close App". |
| **v1.1.3** | Instant UI Feedback (Dashboard DOM updates immediately). |
| **v1.1.4** | Reset Button now clears Manual Input fields. |
| **v1.1.5** | Viewer Font change to 'Oswald', 'Time Up' vertical center fix. |
| **v1.1.6** | Pulsing Red/Black background for "TIME UP" state. |
| **v1.1.7** | Session Title Refactor: Manual Show/Clear buttons, Non-persistent, Smaller/Bolder Viewer text. |

## 5. Technical Stack
- **Engine**: Node.js / Electron.
- **Frontend**: Vanilla HTML/CSS/JS.
- **Build System**: electron-builder (NSIS for Windows).
