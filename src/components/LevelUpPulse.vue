<script setup lang="ts">
withDefaults(
  defineProps<{
    accent: string
    /** Optional add-on — set false to drop the burst and keep only the glow. */
    particles?: boolean
  }>(),
  { particles: true },
)

// Fixed offsets rather than random ones: the burst has to look the same every time
// so it can be tuned. The origin sits on the top edge, so every dot fans downward.
const PARTICLES = [
  { dx: -104, dy: 34, size: 3, delay: 0 },
  { dx: -78, dy: 66, size: 4, delay: 20 },
  { dx: -52, dy: 22, size: 3, delay: 45 },
  { dx: -28, dy: 78, size: 3, delay: 10 },
  { dx: -10, dy: 48, size: 4, delay: 55 },
  { dx: 14, dy: 84, size: 3, delay: 30 },
  { dx: 38, dy: 30, size: 4, delay: 0 },
  { dx: 62, dy: 62, size: 3, delay: 48 },
  { dx: 88, dy: 26, size: 3, delay: 18 },
  { dx: 112, dy: 54, size: 3, delay: 38 },
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
          backgroundColor: accent,
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

/* Thrown out from the origin, then pulled straight back in. */
@keyframes particleBurst {
  0% {
    transform: translate(0, 0) scale(0.4);
    opacity: 0;
  }
  30% {
    transform: translate(var(--dx), var(--dy)) scale(1);
    opacity: 0.9;
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
  animation: particleBurst 620ms ease-out forwards;
}
</style>
