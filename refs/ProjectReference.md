# GymDeck PWA — Project Reference & Roadmap

> **How to use this document:** Read it fully before writing any code. It is the single source of truth for design, data, interactions, and architecture. Work through the phases in order. Each phase ends with a clearly testable milestone.

---

## 1. Project Overview

A **frontend-only Progressive Web App (PWA)** installable on a smartphone. No backend, no auth. All data lives in `localStorage`. Written in **Vue 3** (Composition API, `<script setup>`) with **Tailwind CSS**, **Pinia** for state, **Vue Router** for page navigation, **Vite** as build tool with `vite-plugin-pwa`, **Chart.js** via `vue-chartjs` for charts, and **@vueuse/core** for composables (gestures, local storage).

### Core Pages / Views

| Route | View | Access |
|---|---|---|
| `/` | `MainView` | Default on open |
| `/stats` | `StatsView` | Touch gesture from Main, or back-button from Stats |
| `/fitness` | `FitnessView` | Button top-right on Main |
| `/settings` | `SettingsView` | Button on Main or Fitness |

---

## 2. Tech Stack

```
Vue 3 (Composition API, <script setup lang="ts">)
TypeScript — all .ts / .vue files
Vite 8 + vite-plugin-pwa
Pinia 3 (state management + localStorage persistence)
Vue Router 5
Tailwind CSS v4 — @tailwindcss/vite plugin, no tailwind.config.js
@vueuse/core (useSwipe, useLocalStorage, etc.)
Chart.js + vue-chartjs
```

**Do not use:** Options API, Vuex, class components, jQuery, any CSS framework other than Tailwind.

---

## 3. Data Models

All data is persisted to `localStorage` via Pinia stores using `@vueuse/core`'s `useLocalStorage`.

### 3.1 Machine

```ts
interface Machine {
  id: string;           // uuid
  name: string;         // e.g. "Chest Press"
  locationX: number;    // 0.0–1.0, relative position on gym floor card
  locationY: number;    // 0.0–1.0
  currentWeight: number; // kg
  stepSize: number;     // kg to add when "weight up" action is triggered
}
```

### 3.2 Session

```ts
interface MachineEntry {
  machineId: string;    // FK to Machine
  weight: number;       // kg — the weight as performed (snapshot at time of logging)
  weightIncreased: boolean; // true if "Weight Up + Done" was used
}

interface Session {
  id: string;           // uuid
  date: string;         // ISO date string "YYYY-MM-DD"
  machinesDone: MachineEntry[];
}
```

**Weight logic:** When "Weight Up + Done" is triggered, record `weight` as the machine's **current** weight (what was actually lifted that day), then immediately increment `machine.currentWeight` by `machine.stepSize` so the next session starts at the higher weight. The card's displayed weight always reflects `machine.currentWeight`, so if a user changes the step size in Settings before completing a session, the new value takes effect.

A session counts as valid (for streak/stats) if `machinesDone.length >= 1`.

### 3.3 FitnessCheck

```ts
interface FitnessCheck {
  id: string;
  name: string;          // e.g. "Push Ups", "Stretching Reach"
  unit: string;          // e.g. "reps", "cm"
  stepSize: number;      // picker increment, e.g. 1 for push ups, 0.1 for cm
}
```

### 3.4 FitnessMeasurement

```ts
interface FitnessMeasurement {
  id: string;
  checkId: string;       // FK to FitnessCheck
  date: string;          // ISO date string
  value: number;
}
```

### 3.5 UI State (not persisted across sessions, but daily palette is)

```ts
interface UIState {
  dailyPaletteIndex: number; // 0–N, picked once per calendar day
  dailyPaletteDate: string;  // "YYYY-MM-DD", used to detect day change
}
```

---

## 4. Color Palettes

A named list of **8 palettes**. Each palette has 3 wave colors (wave1, wave2, wave3 — from back to front/bottom) and an `accent` color. Picked randomly once per calendar day, stored in `uiStore`. If `dailyPaletteDate !== today`, re-pick.

**`accent` is used for:**
- The location pulse/ripple circles on machine cards
- The "Weight Up + Done" center button
- Chart lines and heatmap cell fill

**Button colors (fixed, not palette-driven):**
- Later button: grey (`#9ca3af` or Tailwind `gray-400`)
- Done button: near-black (`#1a1a1a` or Tailwind `gray-900`)
- Machine cards themselves are always white (`#ffffff`)

```js
export const PALETTES = [
  { name: "Ocean",    wave1: "#0077b6", wave2: "#0096c7", wave3: "#48cae4", accent: "#ade8f4" },
  { name: "Sunset",   wave1: "#e76f51", wave2: "#f4a261", wave3: "#e9c46a", accent: "#ffd6a5" },
  { name: "Forest",   wave1: "#1b4332", wave2: "#2d6a4f", wave3: "#52b788", accent: "#b7e4c7" },
  { name: "Lavender", wave1: "#6a0572", wave2: "#9d4edd", wave3: "#c77dff", accent: "#e0aaff" },
  { name: "Rose",     wave1: "#c9184a", wave2: "#ff4d6d", wave3: "#ff8fa3", accent: "#ffb3c1" },
  { name: "Slate",    wave1: "#023e8a", wave2: "#0077b6", wave3: "#90e0ef", accent: "#caf0f8" },
  { name: "Ember",    wave1: "#7f4f24", wave2: "#b5451b", wave3: "#e2711d", accent: "#ffca3a" },
  { name: "Mint",     wave1: "#006466", wave2: "#0b525b", wave3: "#144552", accent: "#99d8c0" },
]
```

---

## 5. View Specifications

### 5.1 MainView (`/`)

**Background:** `#faf9f7` (set as PWA `background_color` and `theme_color` in manifest too).

**Layout:**
- Top bar (fixed, z above waves):
  - Top-left: Progress counter `"X / Y"` (machines done today / total machines)
  - Top-right: Two icon buttons — **Fitness** (e.g. activity/heart icon) and **Settings** (gear icon)
- Center: `CardStack` component
- Bottom: `WaveBackground` component (animated SVG waves, rising with progress)
- Bottom 25% touch zone: invisible overlay that, when touched/tapped, triggers navigation to `/stats` (slide-up transition)

**Page transitions:**
- To `/stats`: Main page slides **up**, Stats slides in from **bottom**
- To `/fitness`: Main page slides **down**, Fitness slides in from **top**
- To `/settings`: Standard slide-in from right

---

#### 5.1.1 WaveBackground

- 3 layered SVG waves, rendered at the bottom of the screen
- The waves "fill" from bottom upward based on `progress` (0.0–1.0 = machinesDone / total)
- At 0% progress: waves sit at the very bottom (just a sliver visible)
- At 100% progress: waves fill nearly the whole screen
- Each wave has a continuous horizontal sine animation (the wave moves sideways endlessly) using CSS `@keyframes`
- The 3 waves are offset in phase and speed for a parallax effect
- Use the palette's `wave1`, `wave2`, `wave3` colors (back-to-front), each with ~80–90% opacity and a slight vertical gradient darkening toward the bottom
- Wave height transition (as progress changes) should animate smoothly with CSS transition (~600ms ease)

---

#### 5.1.2 MachineCard

A square card. Width and height = 80vw (capped at ~360px on larger screens).

**Card contents:**
- **Top-left:** Machine name, bold, large
- **Top-right:** Small "skip for today" icon button (e.g. ✕ or eye-slash). Skipping removes the card from today's stack without counting as done.
- **Center background:** Location pulse — an SVG with 3–4 concentric expanding circles (CSS `@keyframes` opacity + scale) anchored at `(locationX * 100%, locationY * 100%)` within the card. Circles are colored with the palette's `accent` color, low opacity (~15–25%), so they don't obscure content.
- **Middle:** Current weight display — large bold number + smaller grey "kg" text (not bold)
- **Bottom section:** Three action buttons:
  - **Later** (left) — arrow/clock icon, grey — card goes to back of stack
  - **Weight Up + Done** (center) — arrow-up icon, `accent` color — mark done AND increment machine's `currentWeight` by `stepSize`
  - **Done** (right) — checkmark icon, near-black — mark done at current weight
- Clicking any action button plays the corresponding swipe-out animation, then reveals the next card

**Cards are always white (`#ffffff`).** No palette tint on the card itself.

---

#### 5.1.3 CardStack

- Shows the **current card** (top) and **2 peeking cards** behind/below it (slightly smaller, slightly lower z, partially visible at the bottom edge of the top card)
- Peeking cards: scale ~0.95 and ~0.90, offset downward ~10px and ~20px, no interaction
- When the top card is removed, the next card "grows" to full size with a spring/ease animation (~300ms)
- **Swipe gestures** (using `@vueuse/core` `useSwipe` or manual touch events with `{ passive: false }` to allow `preventDefault`):
  - Swipe **right** → Done (same as Done button)
  - Swipe **left** → Later (same as Later button)
  - Swipe **up** → Weight Up + Done (same as center button)
  - During swipe: card follows finger with rotation (right tilt when swiping right, left tilt when swiping left)
  - On release past threshold (~80px): play full swipe-out animation, trigger action
  - On release before threshold: card snaps back to center
- **If stack is empty:** Show a "Session Complete 🎉" message in the center area with the session stats (machines done, any weight increases)

---

### 5.2 StatsView (`/stats`)

**Navigation in:** Touch gesture from MainView bottom zone (page slides up from bottom). Also navigable via Vue Router directly.

**Navigation out:** Button top-right ("↑ Back" or home icon) — triggers reverse transition (Stats slides down, Main slides back into view from top).

**Background:** `#faf9f7`

**Wave accent:** Waves from the **top** of the screen pointing downward (flip the SVG vertically), filling only ~15% of screen height. Same animation as main page but fixed — they do **not** grow/shrink here. The wave height is static at ~15vh.

**Layout (scrollable, top to bottom):**

1. **Header row:** "Statistics" text top-left, back button top-right
2. **Quick stats row** — 3 equal-width cards side by side:
   - **Streak:** weeks in a row with at least one session (current streak)
   - **Total Sessions:** count of all valid sessions
   - **Total Weight:** sum of `currentWeight` across all machines (a fun vanity number, labelled clearly)
3. **Year Heatmap** — GitHub-style grid:
   - Columns = weeks of the year (52–53), rows = always 1 row (one cell per week, not per day)
   - Cell color: `#e0e0e0` for no session that week, palette `accent` at 40% / 70% / 100% opacity for 1+ sessions
   - Show month labels above the columns
   - Current week highlighted with a subtle border
4. **Per-machine weight progression** — one card per machine:
   - Machine name as card title
   - Line chart (Chart.js / vue-chartjs) with sessions on x-axis, weight on y-axis
   - If fewer than 2 data points, show "Not enough data yet"
   - Use palette `accent` color for the line

---

### 5.3 FitnessView (`/fitness`)

**Navigation in:** Button on MainView top-right (Fitness icon). Main slides **down**, Fitness slides in from **top**.

**Navigation out:** Button top-right on FitnessView — reverse transition (Fitness slides up, Main slides back up from bottom).

**Background:** `#faf9f7`

**Layout:**

1. **Header row:** "Daily Fitness" top-left, two buttons top-right: **Settings** (gear) and **Back** (↓ icon)
2. **Fitness check cards** — one per `FitnessCheck`, stacked vertically, scrollable:

Each card layout:
- **Top-left:** Check name (e.g. "Push Ups")
- **Top-right:** Confirm/save button (checkmark icon) — saves today's value from the picker
- **Left ~80% of card body:** Line chart (Chart.js) showing last 20 measurements. All data points use the palette `wave2` color. Today's pending measurement point is shown in light grey at the right edge of the chart (at the current picker value, updating live as the wheel is turned).
- **Right ~20% of card body:** iOS-style vertical scroll wheel picker for selecting today's value. Increments by the check's `stepSize`. Shows ~5 values at a time with center selection highlighted. Implemented as a custom Vue component (no native `<select>` — build a scrollable drum-roll style picker).

---

### 5.4 SettingsView (`/settings`)

**Navigation in:** From Main or Fitness top-right settings button. Slides in from right.

**Navigation out:** Back button (←) top-left. Slides back to wherever it came from (use router `back()`).

**Layout — three sections:**

#### Section 1: Machines

List of all machines. Each row shows name + current weight. Tap to expand/edit inline or open an edit modal. "Add Machine" button at the bottom of the list.

**Fields per machine:**
- Name (text input)
- Current Weight (number input, kg)
- Step Size (number input, kg)
- Location (2D picker — a small square canvas/div representing the gym floor; user taps to place a dot, which sets `locationX` and `locationY` as 0–1 fractions)

**Delete** with a confirmation prompt.

#### Section 2: Fitness Checks

Same pattern as machines. "Add Fitness Check" button at the bottom.

**Fields per check:**
- Name (text input)
- Unit (text input, e.g. "reps", "cm")
- Step Size (number input)

#### Section 3: Data

- **Export** button: serializes all Pinia store state to a JSON string and triggers a file download (`gymdeck-backup-YYYY-MM-DD.json`)
- **Import** button: file input (`.json`), parses and overwrites all store state after a confirmation dialog
- Show last export date if stored

---

## 6. Navigation & Page Transitions

All transitions use Vue's `<Transition>` component with CSS classes.

| Transition | Effect |
|---|---|
| Main → Stats | Main slides up (`translateY(-100%)`), Stats enters from bottom (`translateY(100%)` → 0) |
| Stats → Main | Stats slides down, Main comes back from top |
| Main → Fitness | Main slides down, Fitness enters from top |
| Fitness → Main | Fitness slides up, Main comes back from bottom |
| Any → Settings | Settings slides in from right |
| Settings → Any | Settings slides out to right |

**Main → Stats trigger:** An invisible touch zone covering the **bottom 25%** of MainView. On `touchstart`/`touchend` in this zone (not a swipe, just a tap/touch), navigate to `/stats`. To avoid conflicts with card swipe gestures, only activate this zone when the `CardStack` is **not** in an active swipe state (use a shared `isSwiping` ref from the card stack).

**Stats → Main trigger:** Button top-right on StatsView.

Transition duration: **350ms**, `cubic-bezier(0.4, 0, 0.2, 1)`.

---

## 7. PWA Configuration

In `vite.config.js`, configure `vite-plugin-pwa`:

```js
{
  registerType: 'autoUpdate',
  manifest: {
    name: 'GymDeck',
    short_name: 'GymDeck',
    theme_color: '#faf9f7',
    background_color: '#faf9f7',
    display: 'standalone',
    orientation: 'portrait',
    icons: [/* 192x192 and 512x512 */]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  }
}
```

Add `<meta name="theme-color" content="#faf9f7">` in `index.html` for iOS Safari notch.
Add `<meta name="apple-mobile-web-app-capable" content="yes">` for iOS standalone mode.
Add safe-area insets via CSS: `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` on the app root.

---

## 8. Project File Structure

```
gymdeck/
├── public/
│   ├── icons/             # PWA icons (192, 512px)
│   └── favicon.ico
├── src/
│   ├── main.ts
│   ├── App.vue            # Router view + global transition wrapper
│   ├── router/
│   │   └── index.ts       # Routes + transition direction meta
│   ├── stores/
│   │   ├── machines.ts    # Pinia: machines list, CRUD
│   │   ├── sessions.ts    # Pinia: session history, today's session
│   │   ├── fitness.ts     # Pinia: checks + measurements
│   │   └── ui.ts          # Pinia: daily palette, transition direction
│   ├── composables/
│   │   └── useDailyPalette.ts  # Returns today's palette colors
│   ├── components/
│   │   ├── MachineCard.vue
│   │   ├── CardStack.vue
│   │   ├── WaveBackground.vue
│   │   ├── LocationPulse.vue      # SVG ripple at x/y
│   │   ├── FitnessCard.vue
│   │   ├── DrumRollPicker.vue     # iOS-style scroll wheel
│   │   ├── WeekHeatmap.vue
│   │   ├── WeightChart.vue
│   │   ├── MachineEditor.vue      # Add/edit form for machines
│   │   ├── FitnessCheckEditor.vue
│   │   └── LocationPicker.vue     # 2D tap-to-place picker
│   ├── views/
│   │   ├── MainView.vue
│   │   ├── StatsView.vue
│   │   ├── FitnessView.vue
│   │   └── SettingsView.vue
│   └── assets/
│       ├── main.css       # Tailwind v4 entry (@import "tailwindcss")
│       └── palettes.ts    # PALETTES constant
├── index.html
├── vite.config.ts
└── package.json
```

---

## 9. Seed / Default Data

On first launch (empty localStorage), seed the stores with:

**Machines (examples — user can replace):**
- Chest Press, weight: 40kg, step: 2.5kg, location: (0.3, 0.4)
- Lat Pulldown, weight: 35kg, step: 2.5kg, location: (0.7, 0.3)
- Leg Press, weight: 80kg, step: 5kg, location: (0.5, 0.8)
- Shoulder Press, weight: 25kg, step: 2.5kg, location: (0.2, 0.6)

**Fitness Checks (examples):**
- Push Ups, unit: "reps", step: 1
- Stretching Reach, unit: "cm", step: 0.5

---

## 10. Build Phases

Work through these phases strictly in order. Do not start a new phase until the current one is fully working.

---

### Phase 1 — Project Scaffold & Data Layer

**Goal:** Running Vite dev server, all stores defined with persistence, seed data loading on first launch.

**Tasks:**
1. ~~Init + install~~ — done. Scaffold, dependencies, Tailwind, and PWA meta tags are already in place.
2. Configure `vite-plugin-pwa` in `vite.config.ts` with the manifest above
3. Create all 4 Pinia stores with `useLocalStorage` persistence and TypeScript interfaces matching Section 3
4. Add seed data logic: on store init, if empty, populate with Section 9 defaults
5. Create `src/assets/palettes.ts` with the 8 palettes from Section 4
6. Create `useDailyPalette.ts` composable
7. Create `src/router/index.ts` with 4 routes (no transitions yet)
8. Verify: `npm run dev`, check Vue DevTools shows stores with seed data

**Milestone:** Dev server runs, stores load, seed data appears in DevTools, palette picks correctly for today.

---

### Phase 2 — MachineCard Component

**Goal:** A single, fully interactive `MachineCard.vue` that looks correct and responds to all gestures/buttons.

**Tasks:**
1. Build static card layout (80vw square, all sections as per 5.1.2)
2. Create `LocationPulse.vue` — SVG ripple animation at `(x%, y%)`, integrate into card background
3. Style with Tailwind + daily palette card color
4. Implement three action buttons with click handlers (emit events: `done`, `later`, `weightUp`)
5. Implement skip button (emit `skip`)
6. Implement swipe gesture detection using `@vueuse/core` `useSwipe` (or manual touch events with `passive: false`):
   - Track drag delta X and Y
   - Apply `transform: translateX() rotate()` during swipe (card follows finger)
   - On release: if past threshold (~80px), trigger corresponding action; else snap back
7. Play swipe-out CSS animation when action is triggered (card flies off in swipe direction)
8. Test in isolation: render one card in `MainView`, verify all gestures and buttons work

**Milestone:** Card renders correctly, all 3 swipe directions work, buttons play swipe animation.

---

### Phase 3 — CardStack & WaveBackground

**Goal:** Full working main page with stack behavior and animated waves.

**Tasks:**
1. Build `CardStack.vue`:
   - Renders top 3 cards, uses CSS `transform: scale() translateY()` for peeking cards
   - Handles card removal + promote-next animation (spring/ease ~300ms)
   - Tracks `isSwiping` boolean (exposed as provide/inject or prop for the touch zone)
   - Shows "Session Complete" state when stack is empty
   - Randomizes machine order once per session (on mount, if no active session today)
   - Connects to `sessionsStore` to record done/skipped/weightUp
2. Build `WaveBackground.vue`:
   - 3 SVG sine-wave paths, animated horizontally with `@keyframes`
   - Accepts `progress` prop (0–1), translates to wave height via CSS variable
   - Smooth transition on height change
3. Assemble `MainView.vue`:
   - Full layout as per 5.1
   - Progress counter reads from `sessionsStore`
   - Bottom 25% touch zone (only active when `!isSwiping`)
   - Navigation buttons (Fitness, Settings) wired to router
4. Add `App.vue` transition wrapper (transition direction stored in `uiStore`)

**Milestone:** Full working gym session on main page. Cards swipe, waves rise, session records to store. Install as PWA on phone and test touch gestures on real device.

---

### Phase 4 — StatsView

**Goal:** Stats page navigable from Main, all statistics correctly computed.

**Tasks:**
1. Wire Main → Stats transition (slide up/down) via Vue Router + CSS transition classes
2. Build `StatsView.vue` layout (header, waves-from-top, scrollable content)
3. Compute and display Quick Stats (streak, total sessions, total weight) — write pure functions in `sessionsStore` getters
4. Build `WeekHeatmap.vue` — CSS grid, 52 columns, month labels, color intensity from palette
5. Build `WeightChart.vue` using `vue-chartjs` LineChart — per machine, sessions on x-axis
6. Assemble all into StatsView

**Milestone:** Navigating to Stats shows correct data; heatmap and charts render; back button returns to Main with correct transition.

---

### Phase 5 — FitnessView

**Goal:** Fitness page navigable from Main, all checks loggable.

**Tasks:**
1. Wire Main → Fitness transition (slide down/up)
2. Build `DrumRollPicker.vue` — custom scrollable wheel picker:
   - Vertical list of values spaced by `stepSize`
   - Drag/scroll to select
   - Selected item centered and highlighted
   - Emits `update:modelValue`
3. Build `FitnessCard.vue`:
   - Line chart with historical data (last 20 measurements) + live grey "today" point using palette `accent` for data points
   - Drum roll picker on the right (20% width)
   - Confirm button saves measurement to `fitnessStore`
4. Assemble `FitnessView.vue`

**Milestone:** Can log a push-up count, see it appear on the chart immediately.

---

### Phase 6 — SettingsView

**Goal:** All data fully editable in-app.

**Tasks:**
1. Wire Any → Settings transition (slide right)
2. Build `LocationPicker.vue` — small square div, tap to set dot position, emits `{x, y}` as 0–1 fractions
3. Build `MachineEditor.vue` — form for all machine fields including LocationPicker
4. Build `FitnessCheckEditor.vue` — form for check fields
5. Assemble `SettingsView.vue` with three sections (machines, fitness checks, data import/export)
6. Implement JSON export (serialize all stores → Blob download)
7. Implement JSON import (file input → parse → overwrite stores with confirmation)

**Milestone:** Can add a new machine, set its gym location, verify it appears in the card stack. Can export and re-import data without loss.

---

### Phase 7 — Polish & PWA Hardening

**Goal:** App feels native-quality on a real phone.

**Tasks:**
1. Audit and fix touch target sizes (minimum 44×44px on all buttons)
2. Apply `safe-area-inset` padding throughout (notch, home indicator)
3. Test and fix any swipe vs. scroll conflicts on iOS Safari and Android Chrome
4. Ensure service worker caches all assets (test airplane-mode launch)
5. Add `<meta name="apple-mobile-web-app-status-bar-style" content="default">` and test on iOS
6. Verify daily palette re-picks correctly at midnight
7. Edge cases: empty machine list (prompt to add in settings), single machine (no peeking cards), session already completed today (show completion screen immediately with option to reset for a new session)
8. Smooth any janky animations found on real device (prefer `transform` and `opacity` over layout-affecting properties for all animations)

**Milestone:** App installed on phone, full session logged end-to-end, data persists across app restarts.

---

## 11. Key Implementation Notes

- **Swipe vs. scroll conflicts:** Register touch listeners with `{ passive: false }` on the card element and call `event.preventDefault()` only after you've determined the gesture is a horizontal or upward swipe (check that `Math.abs(deltaX) > Math.abs(deltaY)` or `deltaY < -threshold`). Do not `preventDefault` on vertical-dominant touches.

- **Bottom touch zone conflict:** The bottom 25% zone on MainView must check `isSwiping` before navigating. Provide `isSwiping` from `CardStack` via `provide`/`inject` or a store flag.

- **Wave SVG approach:** Use a `<path>` with a sine curve approximated by a cubic bezier. Animate via CSS `@keyframes` on a `transform: translateX()`. Do not use JavaScript for the wave animation — CSS-only is smoother.

- **DrumRollPicker:** Implement as a scrollable `div` with `overflow: hidden` and manual touch tracking. Do not use `<select>`. Use `scroll-snap-type: y mandatory` on the container and `scroll-snap-align: center` on each item for a native-feeling snap.

- **Chart.js in vue-chartjs:** Register all required Chart.js components globally in `main.js` to avoid tree-shaking issues. Use `reactive` data binding so charts update when store data changes.

- **CSS transitions for page navigation:** Store transition direction (`'up'`, `'down'`, `'left'`, `'right'`) in `uiStore` before each `router.push()`. In `App.vue`, read `uiStore.transitionDirection` to pick the correct CSS transition class pair. Reset after transition completes.

- **localStorage size:** All data is small. A full year of daily sessions + measurements is well under 1MB. No chunking needed.

- **UUID generation:** Use `crypto.randomUUID()` (available in all modern mobile browsers) — no library needed.
