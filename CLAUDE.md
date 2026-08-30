# GymDeck — Claude Instructions

## Git

- **Never commit, push, or stage files unless the user explicitly asks.** Reading git state (log, diff, status, show) is always fine.
- If you are asked to commit, the message should be in the style I have used already, e.g. "feat: phase 3 part 1 - <small description>" after implementing or "fix: phase 2 review fixed" after phase reviews

## Vue 3

- Always use `<script setup lang="ts">`. Never Options API, never `defineComponent`.
- Feature components (CardStack, etc.) **access Pinia stores and composables directly** — they do not receive store data as props. Only thin shell views that purely assemble components may avoid store access.
- Reactivity: `ref()` for primitives and arrays, `computed()` for derived values. Never mutate computed values.
- Event names in `defineEmits` use camelCase (`weightUp`, `swipeStart`); in templates use kebab-case (`@weight-up`, `@swipe-start`).
- Touch event listeners that call `e.preventDefault()` must be registered with `{ passive: false }`. All others default to `{ passive: true }`.

## TypeScript

- Strict mode is on. Never use `any`. Use type guards (`(x): x is T`) for array filters.
- Array access (`arr[i]`) returns `T | undefined` in strict mode — use non-null assertion (`arr[i]!`) only when the index is provably in range, otherwise guard.
- Run type checks with: `./node_modules/.bin/vue-tsc --build` — never append `2>&1`, it breaks the permission pattern match. **Not `--noEmit`:** `tsconfig.json` is solution-style (`"files": []` plus references), so `--noEmit` checks zero files and always exits 0. Add `--force` to re-check everything rather than only what changed.

## Tailwind / CSS

- Tailwind v4 — no `tailwind.config.js`. Config goes in CSS via `@theme`. Import with `@import "tailwindcss"`.
- Use Tailwind utility classes for layout and spacing. Use inline `:style` bindings only for dynamic values (colors, transforms that vary at runtime).
- CSS `!important` on scoped animation classes beats Vue's inline `:style` — this is intentional for swipe-out animations.

## Dates and timezones

- Always compute dates in **local (German) time**: `getFullYear()`, `getMonth()`, `getDate()`. **Never** use `toISOString()` for date keys — it returns UTC and will mismatch at midnight.

## Project-specific rules

- Node 24 is required (see `.nvmrc`). It is managed by **fnm**, which puts the active version on `PATH` automatically — no `source` prefix is needed before node/npx commands.
- Line endings are LF, enforced by `.gitattributes`. If a whole file suddenly shows as changed, check for CRLF before assuming the content differs.
- `useDailyPalette()` returns a computed singleton — always call it at the top of `<script setup>`, never inside a function.
- Today's deck is persisted as `{ date, order: string[], skipped?: string[] }` in localStorage — IDs only, not objects. Map back to Machine objects on mount so deleted machines are handled gracefully. `skipped` is optional on read because decks saved before it existed lack the field; anything rewriting the deck must preserve it.
