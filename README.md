# GymDeck

A gym session tracker built as an installable PWA for the phone. Your machines come up
one at a time as a swipeable card deck; as you work through them, a wave background
rises from the bottom of the screen to fill it.

Everything runs in the browser. There is no backend, no account, and no network call —
all state lives in `localStorage` on the device.

---

## Screens

| Route       | What it does                                                                             |
| ----------- | ---------------------------------------------------------------------------------------- |
| `/`         | The session. A card stack of today's machines, with the progress waves behind it.         |
| `/stats`    | Streak, session count, a year heatmap, and a weight-progression chart per machine.        |
| `/fitness`  | Daily fitness checks (push-ups, stretching reach, …) logged with a drum-roll picker.      |
| `/settings` | Machines, fitness checks, and data export / import / reset.                                |

Navigation is gestural and directional: Stats slides up from the bottom, Fitness slides
down from the top, Settings slides in from the right. The direction is written to
`uiStore.transitionDirection` before each `router.push()`, and `App.vue` picks the
matching CSS transition pair.

## The session loop

Each card is one machine, showing its current working weight. Three ways to clear it:

- **Done** (swipe right) — logs the machine at its current weight.
- **Level up** (swipe up) — logs it at the current weight, *then* permanently raises
  `currentWeight` by that machine's `stepSize`, so next session starts heavier.
- **Later** (swipe left) — sends the card to the back of the deck. Disabled on the last card.

There is also a skip button in the card's top-right corner, which drops the machine from
today's deck without logging it. A skipped machine also leaves the progress count, so
skipping two of ten still lets the waves fill the screen.

The deck is shuffled once per day and persisted as `{ date, order: string[], skipped: string[] }`,
so closing and reopening the app mid-session — or ducking into Settings — resumes exactly
where you left off rather than reshuffling or resurrecting skipped machines. Machines added
after that shuffle get appended to the end.

## Look and feel

One of eight colour palettes is picked at random per calendar day and drives the wave
colours and the accent throughout the app. Cards stay white; the Later and Done buttons
stay grey and near-black. Only the waves, the level-up button, and chart lines take the
palette.

Each card's background carries a static ring pattern centred on that machine's `(x, y)`
position in your gym's floor plan — so a machine in the far corner and one by the door
produce visibly different cards. It is a wayfinding cue, not decoration, and it does not
animate.

---

## Requirements

- **Node 24** (see `.nvmrc`), managed by [fnm](https://github.com/Schniz/fnm)

## Setup

```sh
npm install
npm run dev          # dev server on http://localhost:5173
```

## Scripts

```sh
npm run dev          # Vite dev server with Vue DevTools
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build locally
npm run type-check   # vue-tsc --build
npm run format       # prettier over src/
```

For a type check without the full build:

```sh
./node_modules/.bin/vue-tsc --build         # add --force to re-check everything
```

Not `--noEmit` — `tsconfig.json` is solution-style (`"files": []` plus project
references), so `--noEmit` type-checks nothing and exits 0 regardless.

---

## Stack

| Concern    | Choice                                                       |
| ---------- | ------------------------------------------------------------ |
| Framework  | Vue 3 — Composition API, `<script setup lang="ts">` only      |
| Build      | Vite 8 + `vite-plugin-pwa` (service worker, `autoUpdate`)     |
| State      | Pinia 3, persisted via `@vueuse/core`'s `useLocalStorage`     |
| Routing    | Vue Router 5                                                  |
| Styling    | Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js` |
| Charts     | Chart.js through `vue-chartjs`                                |
| Icons      | `lucide-vue-next`                                             |
| Language   | TypeScript, strict mode                                       |

Tailwind v4 takes its configuration in CSS rather than a JS config file — `src/assets/main.css`
is the entry point, and any theme customisation belongs in an `@theme` block there. Chart.js
components are registered once in `main.ts` to avoid tree-shaking surprises.

## Layout

```
src/
├── main.ts                 # app bootstrap + Chart.js registration
├── App.vue                 # RouterView wrapped in the directional transition
├── router/index.ts         # 4 routes + a reload-on-stale-chunk guard
├── stores/
│   ├── machines.ts         # machines + CRUD, totalWeight
│   ├── sessions.ts         # session history, today's session, streak, deck order
│   ├── fitness.ts          # checks + measurements
│   └── ui.ts               # daily palette, last export, transition direction
├── composables/
│   └── useDailyPalette.ts  # today's palette as a computed singleton
├── utils/date.ts           # local-time date helpers
├── components/             # CardStack, MachineCard, WaveBackground, editors, charts …
├── views/                  # MainView, StatsView, FitnessView, SettingsView
└── assets/
    ├── main.css            # Tailwind entry + page transitions + the 100vh rule
    └── palettes.ts         # the 8 palettes
```

## Data model

Four `localStorage` keys, all under a `gymdeck-` prefix:

```ts
interface Machine {
  id: string
  name: string
  locationX: number      // 0–1, position on the gym floor
  locationY: number      // 0–1
  currentWeight: number  // kg
  stepSize: number       // kg added on "level up"
}

interface Session {
  id: string
  date: string           // "YYYY-MM-DD", local time
  machinesDone: { machineId: string; weight: number; weightIncreased: boolean }[]
}

interface FitnessCheck {
  id: string
  name: string
  unit: string           // "reps", "cm", …
  stepSize: number       // picker increment
  min?: number
  max?: number
}

interface FitnessMeasurement {
  id: string
  checkId: string
  date: string           // "YYYY-MM-DD", local time
  value: number
}
```

A session counts toward the streak and totals once it has at least one logged machine.
Logged weight is a snapshot of what was actually lifted that day, so raising a machine's
weight later never rewrites history.

On first launch with empty storage, the machine and fitness-check stores seed themselves
with a handful of examples. Settings → Data covers JSON export, import (overwrites
everything, behind a confirmation), and a full reset.

---

## Conventions

These are enforced by review, not by a linter — `CLAUDE.md` is the full version.

- **Dates are always local time.** Build date keys with `getFullYear()` / `getMonth()` /
  `getDate()` via `src/utils/date.ts`. Never `toISOString()` — it returns UTC and will land
  on the wrong day either side of midnight.
- **No `any`.** Strict mode is on; use type guards for array filters. Indexed access returns
  `T | undefined`, so guard it or use `!` only where the index is provably in range.
- **Feature components read stores directly** rather than receiving store data as props.
  Only thin shell views that purely assemble components stay store-free.
- **Touch listeners that call `preventDefault()` must be registered `{ passive: false }`**,
  and only after the gesture's direction is known — otherwise vertical scrolling breaks.
- **Line endings are LF**, pinned by `.gitattributes`.
- `useDailyPalette()` is a computed singleton — call it at the top of `<script setup>`,
  never inside a function.

## PWA and iOS notes

The app targets iPhone in portrait, light mode, installed to the home screen.

Getting edge-to-edge rendering right on iOS took some doing, and two rules are load-bearing:

- `html`, `body`, and `#app` use **`height: 100vh`** — not `100%` (which silently collapses
  `viewport-fit=cover`, so content never reaches the notch) and not `100dvh` (wrong on a
  standalone cold start until the device is rotated).
- The root elements do not scroll; scrolling lives in inner containers. This removes the
  rubber-band region where iOS would otherwise paint the native background colour.

`refs/ios-pwa-edge-to-edge-fix.md` has the full reasoning.

The router also carries a guard for stale lazy chunks: after a deploy, an already-open
session still runs the old entry bundle, whose chunk hashes are gone from the server.
Rather than dying silently on navigation, it reloads once to pick up the fresh bundle.

`public/_redirects` routes all paths to `index.html` so deep links work on a static host.

## About `refs/`

`refs/` holds the original design documents — the project roadmap, the card ring spec, the
wave prototype notes, and the iOS write-up. They are **historical**. The implementation has
moved past them in several places (the heatmap, chart colours, ring opacities, and the
fitness `min`/`max` fields all differ). **Where the code and the refs disagree, the code is
correct.**
