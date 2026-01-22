# Classic Viewer Design Specifications (V1)

## Overview
This document outlines the design implementation of the "Classic" FocusTimer Viewer, specifically focusing on the countdown timer, alerts, and animations.

## 1. Design Tokens & Colors
The viewer uses a high-contrast palette optimized for visibility.

| Token Name | Hex Color | Description |
| :--- | :--- | :--- |
| `--bg-color` | `#000000` | Default Background (Pure Black) |
| `--text-color` | `#FFFFFF` | Default Text (Pure White) |
| `--signal-amber` | `#FBBF24` | Warning / Gentle Alert (Amber) |
| `--signal-red` | `#EF4444` | Critical Alert / Overtime (Red) |

## 2. Alerts & Warning States
The viewer has three distinct warning states controlled by CSS classes.

### A. Gentle Warning (Amber)
*   **Trigger:** Activated when the timer reaches the "Gentle" warning threshold (default: near end).
*   **Visual:** Soft amber glow pulsing from the edges of the screen.
*   **CSS Class:** `.warning-gentle`
*   **Implementation:** Inset Box Shadow
    ```css
    box-shadow: inset 0 0 150px 50px rgba(251, 191, 36, 0.15);
    ```

### B. Critical Warning (Red)
*   **Trigger:** Activated when timer is extremely close to zero.
*   **Visual:** Strong red glow pulsing from edges.
*   **CSS Class:** `.warning-critical`
*   **Implementation:** Inset Box Shadow
    ```css
    box-shadow: inset 0 0 120px 40px rgba(239, 68, 68, 0.15);
    ```

### C. Overtime / Time Up
*   **Trigger:** When timer hits 00:00.
*   **Visual:**
    *   Timer numbers disappear (`opacity: 0`).
    *   "TIME UP" message dissolves in.
    *   Background turns red and "breathes" (pulses).
*   **CSS Class:** `.overtime-mode` (applied to `body`).

## 3. Animations & Effects

### "Breathing" Background Effect (Overtime)
This is the specific effect used when the time is up. It interpolates the background color between a bright signal red and a very dark red/black.

*   **Animation Name:** `bg-pulse-overtime`
*   **Duration:** 4s infinite
*   **Easing:** `ease-in-out`
*   **Color Transition:**
    *   **Start/End (0%, 100%):** `#EF4444` (Signal Red)
    *   **Middle (50%):** `#1a0505` (Deep Dark Red - almost black)

```css
@keyframes bg-pulse-overtime {
    0%, 100% {
        background-color: #EF4444;
    }
    50% {
        background-color: #1a0505;
    }
}
```

### Warning Glow Animations
These animations pulse the intensity of the inner shadow (glow).

**Amber Breathing (3s loop):**
*   **0% / 100%:** Low intensity (`rgba(251, 191, 36, 0.1)`)
*   **50%:** High intensity (`rgba(251, 191, 36, 0.25)`)

**Red Critical Breathing (2s loop - faster):**
*   **0% / 100%:** Low intensity (`rgba(239, 68, 68, 0.15)`)
*   **50%:** High intensity (`rgba(239, 68, 68, 0.35)`)

## 4. Typography & Sizing
*   **Font:** 'Oswald' (Timer), 'Inter' (UI Text)
*   **Timer Size:** Dynamic logic scaling from base `35vw` down to `15vw` depending on character count (e.g., if hours are shown).
