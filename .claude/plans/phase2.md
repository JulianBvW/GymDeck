Phase 2 — MachineCard Component

Context

Phase 1 delivered the data layer (stores, palettes, router). Phase 2 builds the single most important UI element: MachineCard.vue. The card must look correct, display real store data, respond to button taps, and handle swipe gestures with animation. MainView.vue renders one card
in isolation throughout this phase — the full card stack comes in Phase 3.

New dependency to install: lucide-vue-next for button icons (X, ArrowUp, Check, Clock).

Milestone: Card renders correctly, all 3 swipe directions + 3 buttons work, swipe-out animation plays.

---

Part 1 — Static layout + LocationPulse

Commit: Phase 2 part 1 — MachineCard static layout, LocationPulse

src/components/LocationPulse.vue

Pure presentational, no logic. Props: x: number, y: number, accent: string.

Implements the CardReference.md spec exactly:

- Wrapper div with position: absolute; inset: 0; overflow: hidden (matches card's border-radius: 28px; overflow: hidden)
- SVG 100%×100%, absolutely positioned
- <radialGradient> with unique id (use :id="\glow-${x}-${y}-${accent}`"to avoid collisions across cards in the stack): cx/cy at${x*100}%/${y*100}%`, r="70%", three stops at 32%→12%→0% opacity
- <rect> filling 100% with the gradient
- 6 <circle> rings at absolute px radii [40, 78, 120, 168, 220, 280], stroke opacity Math.max(0.04, 0.22 - i\*0.032), fill none, stroke-width 1
- Origin dot: <circle r="4" fill=accent opacity=0.85
- No animation, no CSS transitions on this component. Static SVG only.

src/components/MachineCard.vue

Props: machine: Machine, accent: string

Layout — square card, width: min(80vw, 360px), same for height. White background (#ffffff), border-radius: 28px, overflow: hidden, position: relative, drop shadow.

Layers (bottom → top, all position: absolute or normal flow):

1.  <LocationPulse> — position: absolute; inset: 0; z-index: 0
2.  Card content — position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; padding: 20px

Content sections:

- Top row (space-between): machine name (bold, ~18px) left + skip button (✕ icon, 32×32px tap target) right
- Middle (flex-grow, centered): weight number (bold, ~56px) + "kg" (grey, ~18px, not bold) side by side
- Bottom row: three equal buttons in a row
  - Later: Clock icon, background: #9ca3af (gray-400), white icon
  - Weight Up + Done (center, slightly larger): ArrowUp icon, background: accent
  - Done: Check icon, background: #1a1a1a (gray-900), white icon
  - All buttons: rounded-full, 56×56px minimum (touch target), icon only

No event handlers yet — buttons and skip are visually complete but inert.

src/views/MainView.vue

Call useDailyPalette() and render the first machine from useMachinesStore with the palette's accent. This is the visual verification step.

 <MachineCard :machine="machines[0]" :accent="palette.accent" />

---

Part 2 — Button actions + events

Commit: Phase 2 part 2 — card button actions and store integration

MachineCard.vue — add emits + handlers

const emit = defineEmits<{
done: []
later: []
weightUp: []
skip: []
}>()
Wire each button's @click to emit the corresponding event. No animation yet — buttons just fire.

MainView.vue — handle events

Handle the four emits from the card, calling store actions:

- @done → sessionsStore.logEntry({ machineId: machine.id, weight: machine.currentWeight, weightIncreased: false })
- @weightUp → sessionsStore.logEntry({ machineId: machine.id, weight: machine.currentWeight, weightIncreased: true }) then machinesStore.updateMachine(machine.id, { currentWeight: machine.currentWeight + machine.stepSize })
- @later → no-op for now (Phase 3 handles stack reordering)
- @skip → no-op for now

Note on weightUp weight snapshot: per the spec, weight in the entry is the current weight (what was lifted), then the machine's currentWeight is incremented. The store update must happen after the log entry is recorded.

Console-log the emitted events so they're verifiable in DevTools.

---

Part 3 — Swipe gestures + swipe-out animation

Commit: Phase 2 part 3 — swipe gestures and swipe-out animation

MachineCard.vue — touch handling

Use manual touch events (not useSwipe) with { passive: false } on the card root element — required so preventDefault() can block scroll during horizontal/upward swipes.

const cardEl = ref<HTMLElement>()
let startX = 0, startY = 0, deltaX = 0, deltaY = 0
const isDragging = ref(false)
const dragX = ref(0)
const dragY = ref(0)

- touchstart: record startX, startY, set isDragging = true
- touchmove: compute deltaX/deltaY. Only call preventDefault() if Math.abs(deltaX) > Math.abs(deltaY) (horizontal) or deltaY < -20 (upward). Update dragX/dragY.
- touchend: check threshold (~80px), trigger action or snap back

Card transform during drag:
const cardStyle = computed(() => {
if (!isDragging.value) return {}
const rotate = dragX.value \* 0.08 // degrees, capped ±15
return { transform: `translateX(${dragX.value}px) translateY(${dragY.value < 0 ? dragY.value : 0}px) rotate(${rotate}deg)`, transition: 'none' }
})

Snap-back: when released below threshold, set dragX = 0, dragY = 0 with transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1) (spring feel).

Swipe-out animation

Add a swipeDirection ref ('left' | 'right' | 'up' | null). When threshold crossed:

1.  Set swipeDirection to the appropriate value
2.  Apply CSS class that translates the card off-screen (translateX(-120vw), translateX(120vw), translateY(-120vh)) with transition: transform 300ms ease-in
3.  After 300ms (setTimeout), emit the action event

CSS classes (in <style scoped>):
.swipe-left { transform: translateX(-120vw) rotate(-20deg) !important; transition: transform 300ms ease-in !important; }
.swipe-right { transform: translateX(120vw) rotate(20deg) !important; transition: transform 300ms ease-in !important; }
.swipe-up { transform: translateY(-120vh) !important; transition: transform 300ms ease-in !important; }

Cleanup

Remove touch listeners in onUnmounted to prevent ghost interactions when card is destroyed.

Register listeners in onMounted:
onMounted(() => {
cardEl.value?.addEventListener('touchstart', onTouchStart, { passive: true })
cardEl.value?.addEventListener('touchmove', onTouchMove, { passive: false })
cardEl.value?.addEventListener('touchend', onTouchEnd, { passive: true })
})
onUnmounted(() => {
cardEl.value?.removeEventListener('touchstart', onTouchStart)
cardEl.value?.removeEventListener('touchmove', onTouchMove)
cardEl.value?.removeEventListener('touchend', onTouchEnd)
})

---

Files created / modified

┌──────────────────────────────────┬─────────────────────────────────────┐
│ File │ Action │
├──────────────────────────────────┼─────────────────────────────────────┤
│ src/components/LocationPulse.vue │ Create │
├──────────────────────────────────┼─────────────────────────────────────┤
│ src/components/MachineCard.vue │ Create │
├──────────────────────────────────┼─────────────────────────────────────┤
│ src/views/MainView.vue │ Update (render card, handle events) │
├──────────────────────────────────┼─────────────────────────────────────┤
│ package.json │ Add lucide-vue-next │
└──────────────────────────────────┴─────────────────────────────────────┘

Verification

- npm run dev → navigate to /, see a white card with machine name, weight, buttons, and the rings pattern visible behind
- Rings origin is visually in the correct corner/position for each machine (not centered)
- Tap "Done" → console logs the entry; tap "Weight Up + Done" → weight in DevTools increases by stepSize
- Swipe right → card flies right; swipe left → card flies left; swipe up → card flies up
- Short swipe releases and card snaps back to center with spring animation
- On real device: no page scroll triggered during horizontal swipes

Tag after Part 3 commit: git tag phase-2-done
