<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Drives the glow. Palette accents are pastels, which is right for a large wash. */
    accent: string
    /**
     * Drives the dots. Deliberately NOT the accent: at a few pixels on the #faf9f7
     * background an accent averages 1.4:1 contrast and simply vanishes. wave2 averages
     * 4.6:1 — visible, but softer than wave1's 7.1:1, which read as too heavy.
     */
    particleColor: string
    /** Optional add-on — set false to drop the burst and keep only the glow. */
    particles?: boolean
  }>(),
  { particles: true },
)

// Fixed offsets rather than random ones: the burst has to look the same every time
// so it can be tuned. The origin sits on the top edge, so every dot fans downward.
//
// Travel distance is not cosmetic. The glow is fully opaque accent for the first 35%
// of its radius — about 99px on a 13 mini — and only fades out past ~205px. Dots that
// stop short of that are the same colour on the same colour and simply cannot be seen.
// So every dy clears the opaque core, and dx stays inside ±160 to avoid being clipped
// by MainView's overflow-hidden.
const PARTICLES = [
  { dx: -152, dy: 168, size: 5, delay: 0 },
  { dx: -118, dy: 244, size: 4, delay: 40 },
  { dx: -86, dy: 132, size: 6, delay: 15 },
  { dx: -54, dy: 262, size: 4, delay: 60 },
  { dx: -22, dy: 196, size: 5, delay: 25 },
  { dx: 26, dy: 270, size: 5, delay: 50 },
  { dx: 58, dy: 146, size: 6, delay: 8 },
  { dx: 94, dy: 228, size: 4, delay: 35 },
  { dx: 126, dy: 158, size: 5, delay: 55 },
  { dx: 154, dy: 208, size: 4, delay: 20 },
]
</script>

<template>
  <!-- z-15 sits above the card stack (z-10) so the card dissolves into the light, and
       below the top bar (z-20) so the counter and buttons stay legible. MainView's root
       clips at the top edge, which is what makes this read as light falling in from
       outside — a centred ring would just look cut in half. -->
  <div class="absolute top-0 left-0 right-0 z-[15] pointer-events-none" style="height: 35vh">
    <div
      class="glow"
      :style="{
        background: `radial-gradient(ellipse 100% 100% at 50% 0%, ${accent} 0%, ${accent} 35%, transparent 72%)`,
      }"
    />

    <template v-if="particles">
      <span
        v-for="(p, i) in PARTICLES"
        :key="i"
        class="particle"
        :style="{
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: particleColor,
          animationDelay: `${p.delay}ms`,
          '--dx': `${p.dx}px`,
          '--dy': `${p.dy}px`,
        }"
      />
    </template>
  </div>
</template>

<style scoped>
/* Starts with the button press and outlasts the card's 300ms flight, so the glow is
   still there when the card clears the top edge. */
@keyframes glowPulse {
  0% {
    opacity: 0;
    transform: scaleY(0.9);
  }
  14% {
    opacity: 1;
    transform: scaleY(1);
  }
  100% {
    opacity: 0;
    transform: scaleY(1.05);
  }
}
.glow {
  position: absolute;
  inset: 0;
  transform-origin: top center;
  animation: glowPulse 1000ms ease-out forwards;
}

/* Thrown out from the origin, then pulled straight back in. `both` keeps each dot
   hidden during its stagger delay — with `forwards` alone it sits visible at the
   origin until its turn. */
@keyframes particleBurst {
  0% {
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }
  35% {
    transform: translate(var(--dx), var(--dy)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }
}
.particle {
  position: absolute;
  top: 0;
  left: 50%;
  border-radius: 50%;
  animation: particleBurst 900ms ease-out both;
}
</style>
