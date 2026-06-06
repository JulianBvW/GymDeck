Phase 7 — Polish & PWA Hardening

Context

Phase 7 is the final polish pass: native-quality feel on a real phone, correct PWA installation, and all edge cases handled. No new features, only hardening. Review findings confirmed: all CSS animations already use transform/opacity only (GPU-friendly); MachineCard swipe
handling correctly guards preventDefault behind a direction check; service worker and manifest are configured but PWA icons are missing; safe-area insets are not applied anywhere; several icon buttons are under the 44px touch-target minimum; and two edge cases are unhandled
(zero machines, session reset).

---

Part 1 — Safe-area insets + touch target sizes

Modified: src/assets/main.css, src/components/MachineCard.vue, src/views/MainView.vue, src/views/FitnessView.vue, src/views/StatsView.vue, src/views/SettingsView.vue

Safe-area insets (main.css)

Add to the existing #app block:
#app {
position: relative;
padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
box-sizing: border-box;
}
viewport-fit=cover is already in index.html so env() values will be non-zero on notched devices. box-sizing: border-box keeps the height: 100% intact while shrinking the content area by the inset amounts. WaveBackground (absolute inset-0 relative to each view's root div)
correctly stays inside the safe area, and the background-color: #faf9f7 on html/body fills the notch area seamlessly.

Touch targets

Apple HIG minimum is 44×44px. All icon-button wrappers currently use w-9 h-9 (36px) or w-8 h-8 (32px). Change every icon button wrapper to w-11 h-11 (44px):

┌──────────────────┬───────────────────────────────────────────┬─────────────────────┐
│ File │ Element │ Change │
├──────────────────┼───────────────────────────────────────────┼─────────────────────┤
│ MachineCard.vue │ Skip (✕) button │ w-8 h-8 → w-11 h-11 │
├──────────────────┼───────────────────────────────────────────┼─────────────────────┤
│ MainView.vue │ Fitness + Settings icon buttons │ w-9 h-9 → w-11 h-11 │
├──────────────────┼───────────────────────────────────────────┼─────────────────────┤
│ FitnessView.vue │ Settings icon button, ChevronDown wrapper │ w-9 h-9 → w-11 h-11 │
├──────────────────┼───────────────────────────────────────────┼─────────────────────┤
│ StatsView.vue │ ChevronDown wrapper │ w-9 h-9 → w-11 h-11 │
├──────────────────┼───────────────────────────────────────────┼─────────────────────┤
│ SettingsView.vue │ ChevronLeft wrapper │ w-9 h-9 → w-11 h-11 │
└──────────────────┴───────────────────────────────────────────┴─────────────────────┘

Icon sizes (:size) remain unchanged — only the container grows, so the visual appearance barely changes.

Also add touch-manipulation to any icon buttons missing it:

- MainView.vue Fitness + Settings buttons (currently no touch-manipulation)
- MachineCard.vue Skip button

---

Part 2 — Edge cases

Modified: src/components/CardStack.vue, src/stores/sessions.ts

New store action (sessions.ts)

Add clearTodaySession() — clears today's done list and resets the machine order so cards re-shuffle:
function clearTodaySession() {
const session = sessions.value.find(s => s.date === today.value)
if (session) session.machinesDone = []
machineOrderStorage.value = null
}
Include in the store's return.

CardStack edge cases

Refactor: Extract the onMounted initialization body into a standalone function initCards() so it can be called from both onMounted and the session-reset handler without duplication.

Empty machine list — when machinesStore.machines.length === 0, show a prompt instead of "All done!":

 <div v-if="machinesStore.machines.length === 0" …>
   <p>No machines yet</p>
   <button @click="goToSettings">Add in Settings →</button>
 </div>
 <div v-else-if="remainingMachines.length === 0" …>
   <!-- existing All done! content -->
   <button @click="resetSession">Restart session</button>
 </div>
 goToSettings(): uiStore.transitionDirection = 'right' → router.push('/settings') (CardStack already imports stores directly per project conventions; add useUIStore + useRouter).

Session reset — "Restart session" button calls:
function resetSession() {
sessionsStore.clearTodaySession()
initCards()
}

---

Part 3 — PWA icons

New files: public/icons/icon-192.png, public/icons/icon-512.png

The manifest in vite.config.ts references these paths but the files don't exist — PWA installation on iOS/Android shows a broken icon. These are binary image files that Claude cannot generate. Manual step: create a 192×192 and 512×512 PNG with any design tool (or use a simple
coloured square with the letter "G" as a placeholder) and place them at public/icons/.

Also add to index.html (inside <head>):

 <link rel="apple-touch-icon" href="/icons/icon-192.png" />
 This ensures iOS uses the correct icon for the home screen shortcut, not the favicon fallback.

Daily palette at midnight

No code change needed. useDailyPalette() is called in every view's <script setup> and re-picks whenever dailyPaletteDate !== today — navigation after midnight is sufficient. The app does not need to stay open continuously for midnight re-pick to work.

---

Verification

1.  vue-tsc --noEmit — zero errors after each part.
2.  Part 1 safe-area: Install as PWA on iPhone; top-bar buttons and h1 must clear the notch. Bottom content must clear the home indicator. Wave background fills edge-to-edge (no gap at notch).
3.  Part 1 touch targets: All icon buttons are ≥44px — verify with browser DevTools device emulation.
4.  Part 2 empty list: Delete all machines in Settings → Main shows "No machines yet" + Settings button.
5.  Part 2 session reset: Complete all machines → "All done!" shows → tap "Restart session" → cards re-appear in new random order.
6.  Part 3: Install PWA on device — correct icon shown on home screen, no broken-image placeholder.
