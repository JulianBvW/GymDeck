# GymDeck — TODO

Open wishes, roughly in the order they came up. Tick them off as they land.

Unlike the other files in `refs/`, this one is **not** historical — it describes work
that has not happened yet.

---

## Animations

- [ ] **Session complete.** Something subtle but satisfying when the last machine leaves
      the deck. Today the completion state just pops a check icon in
      (`CardStack.vue`, `.check-pop-in`) — the waves reaching the top of the screen is
      the real moment and it currently passes without comment.
- [ ] **Weight increase.** A small reward when "level up" bumps a machine's weight.
      The card is already flying off screen at that point, so the beat probably belongs
      either on the number just before it leaves, or on the next card as it promotes.

Keep both restrained — the app's whole feel is quiet, and anything bouncy will wear out
fast when it fires several times a session. Transform and opacity only.

## Training log

- [ ] **A small log at the bottom of StatsView.** A quick table, one row per session:
      date · machines done · weight increases.

      Everything needed is already in `sessionsStore.sessions` — each `Session` has
      `date` and `machinesDone`, and each entry carries `weightIncreased`. Newest first,
      and probably capped at some number of rows rather than rendering a full year.

## Heatmap

- [ ] **Mark weeks with two or more sessions.** A star, a different colour, a dot —
      undecided, worth trying a few.

      Note that `WeekHeatmap.vue` is currently binary: `weekState()` returns
      `'done' | 'missed' | 'future'`, so a week with one session and a week with five
      look identical. This needs a count per week, not just a boolean, before any
      visual can express it.
