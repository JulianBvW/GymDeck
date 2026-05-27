Phase 1 — Project Scaffold & Data Layer

Context

The Vite + Vue 3 + TypeScript scaffold already exists at /home/julian/Projects/GymDeck with Pinia and Vue Router installed. Several dependencies are missing (Tailwind, vite-plugin-pwa, @vueuse/core, chart.js, vue-chartjs), the router has no routes, there are only placeholder
stores, and index.html has no PWA meta tags. Phase 1 completes the full data layer so Phase 2 (MachineCard) has a working foundation to build on.

Milestone: Dev server runs, all 4 stores load with seed data visible in DevTools, palette picks correctly for today, 4 routes navigable (stub views).

---

Part 1 — Toolchain & HTML foundation

Commit: Phase 1 part 1 — toolchain, PWA config, Tailwind, HTML meta

Install missing deps:
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa
npm install @vueuse/core chart.js vue-chartjs

vite.config.ts — add two plugins:

- tailwindcss() from @tailwindcss/vite
- VitePWA({ registerType: 'autoUpdate', manifest: { name, short_name, theme_color: '#faf9f7', background_color: '#faf9f7', display: 'standalone', orientation: 'portrait' }, workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'] } })

src/assets/main.css — create with single line:
@import "tailwindcss";

index.html — three changes:

- Title: GymDeck
- Add <meta name="theme-color" content="#faf9f7">
- Add <meta name="apple-mobile-web-app-capable" content="yes">
- Add <meta name="apple-mobile-web-app-status-bar-style" content="default">

src/App.vue — import main.css, keep RouterView placeholder (minimal, no transitions yet).

Verify: npm run dev still starts cleanly.

---

Part 2 — Pinia stores + TypeScript interfaces + seed data

Commit: Phase 1 part 2 — stores, interfaces, seed data

Delete src/stores/counter.ts.

Create four stores matching Section 3 of ProjectReference.md:

src/stores/machines.ts

- Interface: Machine { id, name, locationX, locationY, currentWeight, stepSize }
- State: machines persisted via useLocalStorage('gymdeck-machines', [])
- Seed on empty: 4 machines from Section 9 (Chest Press 40kg, Lat Pulldown 35kg, Leg Press 80kg, Shoulder Press 25kg)
- Actions: addMachine, updateMachine, deleteMachine

src/stores/sessions.ts

- Interfaces: MachineEntry { machineId, weight, weightIncreased }, Session { id, date, machinesDone }
- State: sessions persisted via useLocalStorage('gymdeck-sessions', [])
- Getters: todaySession, totalSessions, currentStreak (weeks)
- Actions: logEntry, startSessionIfNeeded

src/stores/fitness.ts

- Interfaces: FitnessCheck { id, name, unit, stepSize }, FitnessMeasurement { id, checkId, date, value }
- State: checks + measurements both persisted via useLocalStorage
- Seed on empty: Push Ups (reps, step 1), Stretching Reach (cm, step 0.5)
- Actions: addCheck, updateCheck, deleteCheck, logMeasurement

src/stores/ui.ts

- Interface: UIState { dailyPaletteIndex, dailyPaletteDate }
- State: dailyPaletteIndex + dailyPaletteDate persisted via useLocalStorage
- No seed needed — palette logic lives in the composable (Part 3)
- State: transitionDirection: 'up' | 'down' | 'left' | 'right' (NOT persisted — reactive ref only)

All IDs use crypto.randomUUID(). All store mutations go through actions.

src/main.ts — ensure Pinia is created and installed (already is, just verify).

---

Part 3 — Palettes, useDailyPalette, Router, stub views

Commit: Phase 1 part 3 — palettes, composable, router, stub views

src/assets/palettes.ts — export PALETTES array, all 8 palettes from Section 4 of ProjectReference.md (Ocean, Sunset, Forest, Lavender, Rose, Slate, Ember, Mint). Each entry: { name, wave1, wave2, wave3, accent }.

src/composables/useDailyPalette.ts

- Reads uiStore.dailyPaletteIndex and uiStore.dailyPaletteDate
- On call: if dailyPaletteDate !== today, re-pick a random index and update both store values
- Returns computed(() => PALETTES[uiStore.dailyPaletteIndex]) — reactive palette object

src/router/index.ts — replace empty routes array with:
{ path: '/', component: () => import('@/views/MainView.vue') },
{ path: '/stats', component: () => import('@/views/StatsView.vue') },
{ path: '/fitness', component: () => import('@/views/FitnessView.vue') },
{ path: '/settings', component: () => import('@/views/SettingsView.vue')},
History mode. No transition meta yet (Phase 3).

Stub views — create four minimal <template><div>ViewName</div></template> files:

- src/views/MainView.vue
- src/views/StatsView.vue
- src/views/FitnessView.vue
- src/views/SettingsView.vue

src/App.vue — add <RouterView />, import main.css (if not done in Part 1).

Tag after commit: git tag phase-1-done

---

Verification (end of Part 3)

- npm run dev starts without errors
- Navigate to /, /stats, /fitness, /settings — each shows its stub label
- Open Vue DevTools → Pinia tab: all 4 stores visible with seed data
- uiStore.dailyPaletteIndex resolves to one of 0–7; dailyPaletteDate equals today's date
- Re-loading the page preserves store data (localStorage persistence works)
- Re-running useDailyPalette() on a fresh day re-picks the index (manually test by temporarily setting dailyPaletteDate to yesterday)
