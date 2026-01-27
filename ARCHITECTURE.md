# FocusTime Architecture Guide 🏗️

This guide explains how FocusTime works in simple terms. Think of it like a remote-controlled TV system.

## The Big Picture

The app has three main parts:
1.  **The Main Process (The Brain)** 🧠
2.  **The Dashboard (The Remote Control)** 📱
3.  **The Viewer (The TV Screen)** 📺

### 1. The Main Process (main.js)
This is the hidden "manager" of the application.
-   It starts the app.
-   It creates the windows (Dashboard and Viewer).
-   It handles "messages" passed between the Dashboard and the Viewer.
-   It saves settings to a file so they aren't lost if you close the app.
-   **Security:** It ensures the web pages cannot access your computer's files directly (except via safe bridges).

### 2. The Dashboard (src/dashboard/)
This is the window you see on your laptop.
-   **renderer.js**: The code that runs the buttons (Start, Stop, +1m).
-   **Timer Logic**: It holds the actual stopwatch (`src/shared/timer.js`). It counts down time.
-   **Broadcasting**: Every time the clock ticks (10 times a second), it checks if the time display has changed. If it has, it sends a message to the "Main Process" saying: *"Hey, the time is now 05:00!"*

### 3. The Viewer (src/viewer/)
This is the full-screen window on the projector.
-   It is "dumb". It doesn't count time.
-   It just listens for messages. When it hears *"The time is 05:00"*, it updates the text on the screen.
-   This makes it very robust. If the Viewer crashes and restarts, it just waits for the next message from the Dashboard.

---

## Data Flow Diagram

```
[ Dashboard ]  -- sends "Time is 04:59" -->  [ Main Process ]  -- forwards -->  [ Viewer ]
     |                                                                             |
(Calculates Time)                                                            (Updates Text)
```

## Key Files

-   `main.js`: The entry point. Handles window creation and IPC (Inter-Process Communication).
-   `src/shared/timer.js`: The math behind the countdown.
-   `src/dashboard/renderer.js`: The logic for the control panel.
-   `src/viewer/renderer.js`: The logic for the display screen.

## Efficiency & Security Notes

-   **Throttling:** The Dashboard only sends messages when the visual time actually changes (e.g., from 05:00 to 04:59), not every millisecond. This saves computer power.
-   **Isolation:** The windows run with "Context Isolation", meaning the web page code cannot touch the internal computer internals directly. This prevents hacking.
