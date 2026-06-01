# GymTracker — Design Spec

A single-screen iPhone-only gym session app. Randomized stack of machines you swipe through (Tinder-style), with parallax wave background that rises as you complete exercises. Pull-up gesture reveals a stats screen.

**Constraints:** iPhone only, portrait only, no landscape. Light mode only.

---

## Visual System

### Aesthetic
Clean, minimal, mostly monochrome with a single colored accent driven by the chosen palette. Lots of whitespace. Sans-serif for UI, monospaced for numeric readouts.

### Type
- **UI:** system sans (SF Pro / -apple-system fallback)
- **Numbers:** Geist Mono / JetBrains Mono / SF Mono / ui-monospace
- **Scale:** 11/12/14/15/22/26/28/32/72 px. Letter-spacing slightly negative on display sizes (`-0.02em` to `-0.04em`), `0.06–0.12em` on uppercase eyebrows.
- **Weights:** 500 / 600 / 700.

### Color
- Background: `#FAF9F7` (warm off-white)
- Foreground: `#0E0F14` (near-black)
- Surfaces (cards, sheets): `#FFFFFF` with `0.5px solid rgba(0,0,0,0.06)` hairline borders
- Subtle text: `rgba(0,0,0,0.42)` to `rgba(0,0,0,0.55)`
- Fills (chips, secondary buttons): `rgba(14,15,20,0.05)`
- **Accent + waves driven by chosen palette** (see Color schemes)

### Color schemes (palettes)
10 curated schemes. Each has 3 wave colors (light → mid → deep, same hue family) plus a matching accent. The accent equals the deepest wave color.

| id        | name      | waves                                            | accent    |
|-----------|-----------|--------------------------------------------------|-----------|
| ocean     | Ocean     | `#7DB7D6` `#3D7FB8` `#1F4FD9`                    | `#1F4FD9` |
| forest    | Forest    | `#A8C99A` `#5C9A6F` `#2F6B4A`                    | `#2F6B4A` |
| sunset    | Sunset    | `#F4B888` `#E07A4F` `#A83A2A`                    | `#A83A2A` |
| plum      | Plum      | `#C9A8D6` `#9B6FB8` `#5B2D7A`                    | `#5B2D7A` |
| graphite  | Graphite  | `#C4C8CC` `#7A8189` `#3A4048`                    | `#3A4048` |
| sand      | Sand      | `#E8D9BC` `#C4A67A` `#7A5A3A`                    | `#7A5A3A` |
| mint      | Mint      | `#B5E0D2` `#5FB8A0` `#1F6E5C`                    | `#1F6E5C` |
| rose      | Rose      | `#E8B5C4` `#C66B85` `#7A2A45`                    | `#7A2A45` |
| ember     | Ember     | `#F4D88A` `#E0964A` `#9A4A1A`                    | `#9A4A1A` |
| midnight  | Midnight  | `#9BA8D9` `#5B6FB8` `#1F2A6E`                    | `#1F2A6E` |

Default scheme: `ocean`. Persisted via tweaks panel.

### Spacing & radii
- Card radius: 28px
- Sheet/section radius: 18px
- Button radius: 14px (action), 10–12px (icon/corner)
- Standard padding inside surfaces: 14–16px; screen edge: 24px
- Hairline borders, never heavy 1px+

### Shadows
- Top card: `0 24px 48px rgba(14,15,20,0.12), 0 4px 12px rgba(14,15,20,0.05)`
- Peeking cards: `0 8px 20px rgba(14,15,20,0.06)`
- Surfaces: `0 1px 2px rgba(0,0,0,0.02)`
- Accent button glow: `0 6px 18px <accent @ 0.4>`

---

## Data Model

```ts
type Machine = {
  id: string;          // 'm1'…
  name: string;        // e.g. 'Lat Pulldown'
  weight: number;      // current weight in kg
  step: number;        // increment when leveling up (e.g. 5kg)
  x: number;           // 0..1 normalized x in gym floor plan
  y: number;           // 0..1 normalized y
};

type Session = {
  day: string;         // 'YYYY-M-D'
  order: string[];     // machine ids in randomized order
  done: string[];      // ids completed today
  skipped: boolean;    // whole day skipped
};

type HistoryDay = { date: Date; sessions: number; volume: number };
```

**Seed kit:** 10 machines (Lat Pulldown, Chest Press, Leg Press, Cable Row, Shoulder Press, Bicep Curl, Tricep Pushdown, Leg Curl, Leg Extension, Pec Deck), realistic weights (20–140kg), step usually 5kg, x/y spread across the floor.

**Daily randomization:** seeded shuffle of machine ids using the date string as seed (FNV-style hash → mulberry32 PRNG). Closing and reopening the app the same day produces the same order — the session resumes seamlessly. New day → new shuffle.

---

## Screens

### 1. Cards screen (default)

Layout, top → bottom:

1. **iOS status bar** (notched, drawn manually)
2. **Header row**, padding `4px 24px 0`:
   - Left: eyebrow `SESSION · <weekday, mon day>` then big title `{completed} / {total}` (32px / 700) — flips to "All done" when finished.
   - Right: 38×38 rounded-glass pull-down button (bar-chart icon) → opens stats.
3. **Card stack area** (flex: 1). Vertically centered, then nudged up 10% (`transform: translateY(-10%)`).
4. **Pull-up handle** at bottom: chevron + uppercase "STATS" label, drag up >50px to reveal stats.
5. **Home indicator** at the very bottom.

**Background:** three-layer parallax SVG waves (see Waves component) that rise as `progress = completed / total`.

#### Card (322×340px)
White surface with rounded 28px corners. Three layers of content from outside in:

- **Rings background (CardRingsBG):** SVG fills the card. A radial gradient + 6 concentric circles centered at the machine's `(x*100%, y*100%)` so each machine has a unique location-based pattern. Stroke opacity decays with ring radius. A 4px filled dot marks the origin. Uses the accent color.
- **Corner buttons (32×32, top-left/top-right):**
  - TL: ✕ "Skip day"
  - TR: ⚙ "Configure"
- **Content body** (padding `56px 26px 96px`, flex column space-between):
  - Top: machine name, 26px / 700 / -0.025em
  - Bottom: huge weight readout: `{weight}` (72px / 600 monospace) + `kg` (22px / 500 / 0.42 alpha)
- **Action row** (bottom, padding `18px 18px`, grid `1fr auto 1fr`, gap 10px):
  - Left "Later" — ghost (rgba(14,15,20,0.05) bg, dark text) — chevron-double-left icon
  - Center "Level up" — accent-filled, 56px wide, white up-arrow icon, glow shadow
  - Right "Done" — solid black bg, white check icon
- **Swipe overlays:** when dragging past 20px horizontally, a tilted uppercase badge appears in the corresponding top corner ("DONE" rotated -10° on right, "LATER" rotated +10° on left). Opacity scales with drag intensity.

#### Card stack (3 cards visible)
- Top card: interactive (drag/swipe).
- 2 cards behind, peeking 28px below (peek location is 'bottom' by default; configurable to 'top').
- Each subsequent card: scale 1 - depth × 0.05, fully opaque.
- z-index: `100 - depth`.

#### Swipe interaction (Tinder-style)
- Drag horizontally with pointer events.
- Threshold to fire: 100px / sensitivity (sensitivity = 1.0 default).
- During drag: card translates with finger and rotates `dragX / 14` degrees.
- On release past threshold or tap of Later/Done button:
  1. Set `outgoing` state on the parent CardStack (dir: 'left' | 'right' | 'up').
  2. Card transitions transform: right → `translate(600px, -40px) rotate(24deg)` opacity 0; left → mirrored; up → `translateY(-700px)`.
  3. After 280ms (cubic-bezier(.32,.72,.24,1)), parent fires `onLater` / `onDone` / `onFinish`.
  4. Outgoing state cleared after 360ms.
- **Critical:** the React `key` for each Card must be stable (`m.id`, NOT `m.id + (swiping ? '-out' : '')`). If the key changes when swiping starts, React unmounts and remounts the element and the CSS transition is skipped.

#### Buttons
- **Skip day (TL ✕):** clears the whole day's session — sets `skipped: true`. (UI not currently visible after; left as a no-op visual ack.)
- **Configure (TR ⚙):** opens the configure modal screen.
- **Later (bottom-left):** moves the top card to the back of the stack (`order` rotated). Same animation as swipe-left.
- **Level up (bottom-center, accent):** marks the machine done AND increments its `weight` by `step` permanently. Card flies up.
- **Done (bottom-right):** marks the machine done at current weight. Card flies right.

### 2. Stats screen (pulled up from below)

Slides up from below the cards screen — both screens are positioned absolutely in a 2-screen-tall container and translated together. Smooth transition, 480ms.

**Background:** the same Waves component, but **flipped** (`flip` prop) so waves cascade DOWN from the top. Same palette as cards screen, lower intensity (0.32) and slower speed (0.7). 320px tall band at the top.

Layout:

1. iOS status bar (transparent bg over the waves)
2. Pull-down handle (36×4 pill) — tap or drag down to return to cards
3. Eyebrow `STATISTICS` then title `Your progress` (32px / 700)
4. **KPI row** (3 cells): Streak (days), Sessions (/13w), Volume (tonnes)
5. **Sections** (each titled with a small caps SectionTitle):
   - **Sessions per week** — 13-week heatmap, 7 rows × 13 cols of small squares, opacity scales with that day's volume.
   - **Weight evolution** — line chart per machine. Includes a `<select>` dropdown in the section header to switch machines. Weights stair-step up over time. Y-axis padded by ±step.
   - **Total volume lifted** — bar chart, last 4 weeks aggregated.
   - **Personal records** — list. Each row: small star icon chip, machine name + when, monospace weight + "kg".
6. Home indicator pill.

All section cards: white surface, 18px radius, hairline border, `0 1px 2px` shadow.

### 3. Configure screen (modal)

Full-screen sheet with own status bar, slides up from bottom. Top bar: "Cancel" left, "Machines" title center, "Done" right (or back-only).

**List of machines** — each row:
- Name (editable inline)
- Weight (kg input)
- Step (kg input, e.g. 5)
- Position (mini grid; tap to drop the dot — maps to x/y 0..1)
- Delete button

Bottom: **+ Add machine** button (full-width, ghost).

Edits write back to the master `machines` array via `setMachines` (lifted state).

---

## Waves Component (background)

Three parallax sine layers. Each layer is a `<path>` filled with a vertical linear gradient (top: layer color @ ~0.85α; bottom: same @ ~0.5α). The path is built wide enough (W + 2·len) that translating it by `-len` loops seamlessly via CSS keyframe.

```
layers = [
  { amp: 14, len: 320, dur:  9s, opacity ratio 1.0, yOffset: 60, color: wave[0] }, // shallowest, fastest
  { amp: 20, len: 380, dur: 12s, opacity ratio 1.18, yOffset: 30, color: wave[1] },
  { amp: 28, len: 440, dur: 16s, opacity ratio 1.45, yOffset:  0, color: wave[2] }, // deepest, slowest
]
```

`baseY = (1 - progress) * (H - 60) + 30`. Filled area extends from the path down to H.

**Flip mode** (used on stats screen): `baseY = progress * (H - 60) + 30`, layer yOffset is *subtracted*, fill extends UP to 0. Same look, mirrored vertically.

Path transitions on `d` change (600ms cubic-bezier) so progress jumps animate smoothly.

---

## Tweaks Panel

Single section labelled "Color scheme". 10 swatch cards in a 2-col grid. Each swatch shows 3 wave-color stripes + a fourth accent stripe. Tap to apply. Active scheme has a ring outline.

Persisted defaults (single source of truth at the top of the HTML file):

```js
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "schemeId": "ocean"
}/*EDITMODE-END*/;
```

The Root component derives `enrichedTweaks` from the chosen scheme:

```js
const enrichedTweaks = {
  schemeId, accent: scheme.accent, waveColors: scheme.wave,
  peekLocation: 'bottom', sensitivity: 1.0, // hardcoded
};
```

(`peekLocation`, `sensitivity` were originally tweakable; collapsed out per user request.)

---

## File Structure

```
GymTracker.html        // shell: React/Babel CDN, fonts, TWEAK_DEFAULTS, <Root>
ios-frame.jsx          // iPhone bezel + status bar starter
waves.jsx              // Waves + WaveLayer + buildWave (with flip support)
tweaks-panel.jsx       // TweaksPanel + useTweaks + Tweak* controls
card-stack.jsx         // CardStack + Card + CardRingsBG + ActionButton + SwipeOverlay
cards-screen.jsx       // CardsScreen wrapper + PullUpHandle + DoneState
stats-screen.jsx       // StatsScreen + Heatmap + EvolutionChart + VolumeChart + KPI
configure-screen.jsx   // ConfigureScreen + machine row + position picker
app.jsx                // GymApp (root state), seed data, history gen, color schemes
```

Babel scripts share the global window scope. Components are exported via `Object.assign(window, {...})` at the end of each file.

---

## Interaction notes

- All transitions: `cubic-bezier(.32,.72,.24,1)` 240–280ms. iOS-feeling.
- Pointer events (not touch/mouse) so the same code handles both desktop testing and mobile.
- `setPointerCapture` on drag start so dragging beyond the element keeps tracking.
- Buttons inside the draggable card carry `data-card-button` so the parent's `onPointerDown` can early-return and not start a drag.

## Out of scope / not built
- Real gym-machine database
- Real persistence beyond per-day session (no backend, no localStorage for history — generated on mount for the demo)
- Authentication, profiles, social
- Workout timer / rest timer
- Actual session-skip UI feedback past the icon press
