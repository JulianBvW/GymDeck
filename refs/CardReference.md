# Card background "rings" pattern — spec
 
**This is NOT an animation.** The card's background pattern is **completely static** — no pulsing, no breathing, no movement. The name "pulse" refers to the *visual metaphor* (a ripple frozen in time, like a single ping on a radar screen), not motion.
 
The pattern depicts **where the machine is in the gym** by drawing concentric rings emanating from a point on the card whose position corresponds to the machine's x/y coordinates in the gym floor plan. Different machines → different ring origins → visually distinct cards.
 
## Inputs
 
- `x`: number in `[0, 1]` — horizontal position in the gym, 0=left wall, 1=right wall
- `y`: number in `[0, 1]` — vertical position in the gym, 0=top, 1=bottom
- `accent`: hex color string (the chosen color scheme's accent)
 
These map directly to a point on the card surface: a machine at `x=0.18, y=0.22` puts the ring origin at 18% from the left edge and 22% from the top of the card. The origin can sit anywhere — including near or off the edges — and the rings extend in whatever direction is available.
 
## Visual structure (4 layers, painted bottom → top)
 
1. **Soft radial glow** — a single radial gradient filling the entire card, with the gradient's focal point at `(x, y)`. Three stops:
   - 0%: `accent` at **32%** alpha
   - 35%: `accent` at **12%** alpha
   - 100%: `accent` at **0%** alpha (transparent)
   - Gradient radius: **70%** of the card's bounding box
 
   This produces a soft luminous halo around the origin, fading out smoothly.
 
2. **Six concentric rings (stroked circles)** — all centered at `(x, y)` with these absolute pixel radii: **40, 78, 120, 168, 220, 280**. Each ring:
   - `stroke`: `accent`
   - `fill`: none
   - `stroke-width`: **1px**
   - `stroke-opacity`: starts at **0.22** for the innermost ring and decreases by **0.032** per ring outward, clamped to a minimum of **0.04**.
 
   Concretely:
   | i | radius | opacity |
   |---|--------|---------|
   | 0 | 40     | 0.220   |
   | 1 | 78     | 0.188   |
   | 2 | 120    | 0.156   |
   | 3 | 168    | 0.124   |
   | 4 | 220    | 0.092   |
   | 5 | 280    | 0.060   |
 
   The radii are deliberately **not** evenly spaced — gaps grow from ~38px to ~60px so the pattern feels organic, not mechanical.
 
3. **Origin dot** — a small filled circle at `(x, y)`:
   - radius: **4px**
   - fill: `accent`
   - opacity: **0.85**
 
## Coordinate mapping
 
The card is 322×322 px (square). With percentage-positioned coordinates, the rings render at the same percentage point regardless of card size — but the ring radii are absolute pixels, so they look the same diameter everywhere even as the card scales. This is intentional: the rings represent *distance* in the gym, not a scale-invariant pattern.
 
Ring radii are large relative to the card (the largest is 280px, the card is 322px). At most ring origins, half of the rings extend past the card edge and get clipped. **This is the look** — partial circles bleeding off the edge are part of the design. Do not shrink the radii to "make them fit."
 
## Clipping
 
The whole SVG is wrapped in a `<div style="overflow: hidden">` that matches the card's rounded-corner mask (the card itself has `border-radius: 28px`, `overflow: hidden`). The rings get clipped naturally by the card's bounds.
 
## SVG structure
 
```jsx
<div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
  <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
    <defs>
      {/* unique gradient id per (accent, x, y) to avoid collisions across cards */}
      <radialGradient id={uniqueId} cx={`${x*100}%`} cy={`${y*100}%`} r="70%">
        <stop offset="0%"   stopColor={accent} stopOpacity="0.32"/>
        <stop offset="35%"  stopColor={accent} stopOpacity="0.12"/>
        <stop offset="100%" stopColor={accent} stopOpacity="0"/>
      </radialGradient>
    </defs>
    {/* glow */}
    <rect width="100%" height="100%" fill={`url(#${uniqueId})`}/>
    {/* rings */}
    {[40, 78, 120, 168, 220, 280].map((r, i) => (
      <circle key={i}
              cx={`${x*100}%`} cy={`${y*100}%`} r={r}
              fill="none"
              stroke={accent}
              strokeOpacity={Math.max(0.04, 0.22 - i * 0.032)}
              strokeWidth="1"/>
    ))}
    {/* origin dot */}
    <circle cx={`${x*100}%`} cy={`${y*100}%`} r="4"
            fill={accent} opacity="0.85"/>
  </svg>
</div>
```
 
## Stacking order on the card
 
The rings live in the deepest visible layer of the card, beneath:
- the machine name (top of card, z above bg)
- the corner buttons (skip / configure)
- the big weight readout
- the action buttons row
 
i.e. the rings are decoration, not foreground.
 
## What it must NOT do
 
- ❌ **No animation.** No CSS transitions, no SVG `<animate>`, no requestAnimationFrame. Static SVG only.
- ❌ **No pulsating opacity / scale.** The pattern is painted once and never changes after mount.
- ❌ **No "single small ring expanding outward"** like a radar ping. There are always exactly 6 rings, all visible, at fixed radii.
- ❌ **Do not shrink the radii to keep all rings inside the card** — partial clipping at the edges is the intended look.
- ❌ **Do not center the rings.** The origin is always `(x, y)` of the specific machine, never the card center.
 
## When `accent` or `x/y` changes
 
If the chosen color scheme changes, the same pattern re-renders with the new accent. If `x/y` change (e.g. the user re-positions a machine in Configure), the rings re-render at the new origin. Both happen as plain React re-renders — no special transition needed. A 200–300ms `transition: fill 200ms` on the strokes/fill is acceptable if a smooth color swap matters, but is not required.
 
## Why this works
 
- The rings give every machine a **unique visual signature** rooted in real spatial info, not a random pattern.
- Because they're partly clipped, the brain reads them as "originating from somewhere over there" — a subconscious wayfinding cue.
- The soft radial gradient warms the card with the accent color without overpowering the foreground text.
- Static = zero CPU/GPU cost. Animating this would be expensive on a stack of 3 cards and would distract from the content.