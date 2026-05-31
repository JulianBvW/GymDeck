# GymDeck — Claude Instructions

## Git
- **Never commit, push, or stage files unless the user explicitly asks.** Reading git state (log, diff, status, show) is always fine.

## Vue 3
- Always use `<script setup lang="ts">`. Never Options API, never `defineComponent`.
- Feature components (CardStack, etc.) **access Pinia stores and composables directly** — they do not receive store data as props. Only thin shell views that purely assemble components may avoid store access.
- Reactivity: `ref()` for primitives and arrays, `computed()` for derived values. Never mutate computed values.
- Event names in `defineEmits` use camelCase (`weightUp`, `swipeStart`); in templates use kebab-case (`@weight-up`, `@swipe-start`).
- Touch event listeners that call `e.preventDefault()` must be registered with `{ passive: false }`. All others default to `{ passive: true }`.

## TypeScript
- Strict mode is on. Never use `any`. Use type guards (`(x): x is T`) for array filters.
- Array access (`arr[i]`) returns `T | undefined` in strict mode — use non-null assertion (`arr[i]!`) only when the index is provably in range, otherwise guard.
- Run type checks with: `source ~/.nvm/nvm.sh && ./node_modules/.bin/vue-tsc --noEmit` — never append `2>&1`, it breaks the permission pattern match.

## Tailwind / CSS
- Tailwind v4 — no `tailwind.config.js`. Config goes in CSS via `@theme`. Import with `@import "tailwindcss"`.
- Use Tailwind utility classes for layout and spacing. Use inline `:style` bindings only for dynamic values (colors, transforms that vary at runtime).
- CSS `!important` on scoped animation classes beats Vue's inline `:style` — this is intentional for swipe-out animations.

## Dates and timezones
- Always compute dates in **local (German) time**: `getFullYear()`, `getMonth()`, `getDate()`. **Never** use `toISOString()` for date keys — it returns UTC and will mismatch at midnight.

## Project-specific rules
- Node 24 is required. Load it with `source ~/.nvm/nvm.sh` before any node/npx command in Bash.
- `useDailyPalette()` returns a computed singleton — always call it at the top of `<script setup>`, never inside a function.
- Machine order is persisted as `{ date, order: string[] }` in localStorage — IDs only, not objects. Map back to Machine objects on mount so deleted machines are handled gracefully.
- `transform-origin: top center` on peeking cards; index 1 uses `translateY(36px) scale(0.93)`, index 2 uses `translateY(74px) scale(0.86)`.
