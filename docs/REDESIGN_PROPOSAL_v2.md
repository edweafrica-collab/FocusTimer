# FocusTimer — UI/UX Redesign Proposal v2.0

**"Invisible control. Unmissable time."**

> This document outlines a system-level redesign of FocusTimer to feel calmer, sharper, more modern, and more intentional—while respecting the dual-screen philosophy and professional intent.

---

## Table of Contents

1. [Core UX Philosophy](#1-core-ux-philosophy)
2. [New UX Principles](#2-new-ux-principles)
3. [Visual Identity](#3-visual-identity)
4. [Typography System](#4-typography-system)
5. [Dashboard Redesign](#5-dashboard-redesign)
6. [Viewer Redesign](#6-viewer-redesign)
7. [Motion Design](#7-motion-design)
8. [Accessibility](#8-accessibility)
9. [Emotional Outcome](#9-emotional-outcome)

---

## 1. Core UX Philosophy

### Current Strengths (Keep)

- Dual-window architecture (Controller vs Viewer)
- Large, readable timer
- Calm → warning → critical escalation
- Professional, distraction-free intent

### Problems to Fix

- UI feels *functional*, not *delightful*
- Dashboard is dense and visually heavy
- Too many equal-weight elements competing for attention
- Dark theme is safe but slightly generic
- Lacks a strong *brand emotion*

---

## 2. New UX Principles

### 1. Hierarchy is Everything

Only ONE thing is loud at any moment:
- **Viewer** → the time
- **Dashboard** → the primary action (Start / Pause)

Everything else whispers.

### 2. Calm by Default

- No harsh borders unless necessary
- Motion replaces color where possible

### 3. Muscle Memory Over Menus

- Frequent actions are spatially predictable
- Rare actions are hidden, not removed

### 4. Feels Native, Not Web-Wrapped

- Windows users expect clarity and spacing
- macOS users expect restraint and typography
- We meet in the middle

---

## 3. Visual Identity

### Color System (Modernized)

Instead of "dark grey everywhere", we introduce **depth and temperature**.

#### Base Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Canvas Black | `#0B0D10` | App background (darker, cooler than #121212) |
| Surface Graphite | `#15181D` | Cards, panels |
| Elevated Surface | `#1C2026` | Inputs, modals |

#### Accent Colors (Single Accent Rule)

| Token | Hex | Usage |
|-------|-----|-------|
| Signal Green | `#4ADE80` | Start, success, active |
| Signal Amber | `#FBBF24` | Gentle warning |
| Signal Red | `#EF4444` | Critical / overtime |

> **Rule:** No blue. No gradients. One accent at a time.

---

## 4. Typography System

### New Font Stack

| Role | Font | Rationale |
|------|------|-----------|
| UI / Labels | **Inter** | Neutral, modern, OS-friendly |
| Numbers / Time | **IBM Plex Mono** | Professional, less aggressive than Roboto Mono |
| Viewer Timer | **Oswald** | Maximum impact, used sparingly |

> **Key Rule:** Oswald appears **only on the audience screen**. This makes the Viewer feel *special*.

---

## 5. Dashboard Redesign

### Overall Goals

- More breathing room
- Fewer visible borders
- Strong vertical rhythm
- Reduced visual noise

### A. Header (Simplified)

**Before:**
```
FOCUSTIME        [Show Screen]  │  Dual Display Ready  ●
```

**After:**
```
FocusTimer                                        ● Dual Display
```

Changes:
- App name in **sentence case**, not uppercase
- Status dot (green/gray) instead of badge
- "Show Screen" becomes an icon button (monitor icon)

### B. Timer Panel (The Star)

**New Layout:**
- No heavy card border
- Subtle background elevation
- Timer feels *anchored*, not boxed

```
                    12:00
                    READY
```

**Color States:**
- **Idle:** White
- **Gentle:** Amber glow (not color swap)
- **Critical:** Red glow + subtle shake (1px micro-motion)

### C. Duration Input (Reimagined)

**Instead of big MM/SS boxes → Stepper Inputs:**
```
[ 12 ] minutes     [ 00 ] seconds
```

Features:
- Scroll wheel support
- Arrow keys supported
- Click + drag to scrub values

### D. Presets (Chips, Not Buttons)

```
+5m   +10m   +15m   +30m   +60m
```

- Inline, horizontal
- Muted until hover
- Clearly additive ("+" prefix is critical UX clarity)

### E. Primary Actions (Simplified)

```
        [        START        ]
                Reset
```

- Start is full-width
- Reset is text-style until needed
- Pause replaces Start *in-place* (no layout shift)

### F. Session Title (De-emphasized)

Moved into a **collapsible section:**
```
▸ Session details
```

Rationale: Most users won't use it every time.

---

## 6. Viewer Redesign

### A. Layout Philosophy

- Fewer elements
- More negative space
- Everything feels deliberate

### B. Timer Display

- Oswald stays (exclusive to Viewer)
- Slight letter-spacing reduction
- Smoother size interpolation
- No jitter ever

**When time hits 00:00:**
1. Numbers **freeze**
2. Then dissolve into "TIME UP"

This feels more respectful than instant replacement.

### C. Warning System (More Elegant)

Instead of aggressive pulses:
- **Ambient glow** from edges
- Color temperature shift
- Pulse frequency increases as time decreases

Audience *feels* urgency without panic.

### D. Overtime State (Iconic)

Instead of flashing red immediately:
1. Screen darkens
2. "TIME UP" fades in
3. Background begins slow red pulse

This feels *authoritative*, not alarmist.

---

## 7. Motion Design

Motion is what makes this feel premium.

### Timing

- All transitions: **200–300ms**
- Ease: `cubic-bezier(0.4, 0.0, 0.2, 1)`
- No bounce, no spring

### Examples

| Action | Animation |
|--------|-----------|
| Start timer | Timer gently scales from 0.98 → 1.0 |
| Warning | Glow breathes, not flashes |
| Viewer entry | Fades + slides 8px |
| Button hover | Slight lift (translateY -1px) |

---

## 8. Accessibility

### Windows Users

- Clear spacing
- Visible affordances
- Predictable keyboard behavior

### macOS Users

- Minimal chrome
- Subtle contrast
- Typography-led hierarchy

### Shared Wins

- Tabular numbers everywhere
- ESC always works
- Space = start/pause (muscle memory)

---

## 9. Emotional Outcome

After redesign, users should feel:

| Context | Emotion |
|---------|---------|
| Dashboard | **In control** |
| Viewer | **Confident** |
| Audience perception | **Professional** |
| Warning states | **Calm** (no panic visuals) |

> **This is not a "timer app". It's a stage tool.**

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Update CSS variables to new color system
- [ ] Replace Roboto Mono with IBM Plex Mono (dashboard)
- [ ] Keep Oswald for Viewer only

### Phase 2: Dashboard
- [ ] Simplify header layout
- [ ] Remove card borders from timer panel
- [ ] Implement stepper-style duration inputs
- [ ] Convert preset buttons to chips
- [ ] Redesign primary action buttons
- [ ] Make session title collapsible

### Phase 3: Viewer
- [ ] Implement dissolve transition for TIME UP
- [ ] Replace pulse animations with ambient glow
- [ ] Add subtle micro-motion for critical state
- [ ] Implement staged overtime sequence

### Phase 4: Motion & Polish
- [ ] Apply consistent timing curves
- [ ] Add hover/focus micro-interactions
- [ ] Test cross-platform feel

---

## Summary

This redesign makes FocusTimer:
- Feel **intentional**
- Feel **premium**
- Feel **memorable**
- Feel **worthy of a stage**
