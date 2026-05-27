---
name: phase-review
description: >
  Structured post-phase review for the GymTracker PWA project. Run this after
  finishing any build phase to catch requirement gaps, code quality issues, and
  regressions before moving on. Invoke as `/phase-review 3` (or whatever phase
  number was just completed). Use this whenever a phase milestone is reached,
  even partially — catching problems early is cheaper than fixing them two phases
  later. Also useful after a fix session to verify the fix didn't introduce new
  issues.
argument-hint: "phase number just completed (e.g. 3). Assumes a git tag `phase-N-done` was created after the previous phase's final commit."
invocation: user
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git log *), Bash(find * -name "*.vue"), Bash(find * -name "*.js")
---

# Phase Review — Phase $ARGUMENTS

You are a reviewer for the GymTracker PWA. The phase just completed is **Phase $ARGUMENTS**.

Your role here is **reviewer only** — read code, report findings, do not edit anything. The developer will decide what to fix.

---

## Step 0 — Load context

Read `refs/ProjectReference.md`. Extract the task list and milestone for Phase $ARGUMENTS. Note which phases precede it — you'll do a regression check on those too. Everything scoped to phases *after* $ARGUMENTS is out of scope; don't flag missing features that aren't due yet.

**Determine the diff range.** Each phase ends with a git tag `phase-N-done`. Run:
```
git tag
```
to confirm the previous phase's tag exists (e.g. `phase-2-done` when reviewing Phase 3). Then use `phase-(N-1)-done..HEAD` as the diff range for all git commands in Steps 1 and 2. If Phase $ARGUMENTS is Phase 1 (no prior tag), use the initial commit: `git log --oneline | tail -1` to get the root SHA and diff from there, or simply diff all tracked files.

Remind yourself: each phase is split into multiple commits. The tag ensures you see the *entire* phase in one diff, not just the last commit.

---

## Step 1 — Requirements check

Work through the Phase $ARGUMENTS task list item by item. For each task:

- State the requirement briefly
- Mark it: ✅ implemented / ⚠️ partial / ❌ missing
- For anything not ✅: quote the relevant line from the spec and describe what's actually there instead

Then do a **regression pass**: scan key files from phases 1 through $ARGUMENTS−1 and spot-check that their milestone behaviour still holds. Things break quietly — a store refactor in Phase 3 can silently break the seed data logic from Phase 1.

---

## Step 2 — Code quality

Find the `.vue` and `.js` files added or modified in Phase $ARGUMENTS using the tag range established in Step 0:
```
git diff --name-only phase-(N-1)-done..HEAD
git diff phase-(N-1)-done..HEAD
```
Fall back to `find` for recently changed files only if git is unavailable.

Look through them for:

**Vue 3 correctness** — missing `:key` on `v-for`, reactivity breaks from destructuring reactive objects, watchers or listeners not cleaned up in `onUnmounted`, props mutated directly instead of emitting.

**Edge cases** — what happens with zero machines in the store? With exactly one machine (no peeking cards)? With `currentWeight` at zero? With a session already completed today?

**Code smell** — magic numbers not extracted to constants, logic that appears in two places and belongs in a composable, components over ~200 lines of `<script setup>` (a signal to split), variable names that need a comment to understand.

**Project consistency** — IDs from `crypto.randomUUID()`, all store mutations going through actions, `accent` used everywhere (not `card` or other old names), `uiStore.transitionDirection` set before every `router.push()`.

Format each finding as:
> **[file:line]** What the problem is → one-sentence suggestion

---

## Step 3 — Security and data integrity

This is a localStorage PWA with no network calls, so the surface is small but worth checking:

- Is `v-html` used anywhere on user-provided strings like machine names or fitness check names? (Should be `{{ }}` text interpolation only — `v-html` on user input is an XSS vector even in a local app if data is ever shared or imported.)
- Are `{ passive: false }` touch listeners removed in `onUnmounted`? Leaking them causes ghost interactions when navigating between views.
- Is there a `try/catch` around localStorage reads? Private browsing mode on some browsers blocks storage entirely; a graceful fallback prevents a blank crash screen.
- (Phase 6+ only) Does the JSON import validate the data shape before writing? A malformed import file should warn and bail, not silently corrupt the stores.

---

## Step 4 — Summary

| Area | Status | Critical | Minor |
|---|---|---|---|
| Requirements | ✅ / ⚠️ / ❌ | N | N |
| Code quality | ✅ / ⚠️ / ❌ | N | N |
| Security | ✅ / ⚠️ / ❌ | N | N |

**Critical** = causes a bug, data loss, or broken milestone. Fix before starting Phase $ARGUMENTS+1.
**Minor** = smell or inconsistency. Fine to defer to Phase 7 polish, but log it.

Close with one sentence: either "Safe to proceed to Phase $ARGUMENTS+1" or "Fix the N critical finding(s) above before proceeding."
