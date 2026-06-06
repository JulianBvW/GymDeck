Phase 6 — SettingsView

Context

Phase 6 builds the settings screen — the only place users can manage their machines and fitness checks, and export/import their data. The stub (src/views/SettingsView.vue) already exists with a working back-button and correct slide-right transition wired from MainView.
All store CRUD actions (addMachine, updateMachine, deleteMachine, addCheck, updateCheck, deleteCheck) are already implemented and ready to wire up. FitnessCheck already has min?/max? fields (added in Phase 5). uiStore needs one new persisted field: lastExportDate.

---

Part 1 — SettingsView shell + Machines section

New files: src/components/LocationPicker.vue, src/components/MachineEditor.vue
Modified: src/views/SettingsView.vue

SettingsView shell

Replace "Coming soon" stub. Mirror the Stats/Fitness layout:

- bg-[#faf9f7], WaveBackground :flip="true" :progress="0.1" with palette colors from useDailyPalette()
- Header: full-div tap zone with ChevronLeft, small-caps "Settings" span, h1 class="-mt-2" title "Settings"
  - goBack(): uiStore.transitionDirection = 'left' → router.back()
- Scrollable content: overflow-y-auto pt-4 pb-8 px-5 flex flex-col gap-8
- Three section headings (small-caps label style matching WeightChart section label: text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2 px-1)

LocationPicker component

Props: modelValue: { x: number; y: number }, accent: string
Emits: update:modelValue

- Fixed w-28 h-28, rounded-xl bg-gray-100, relative, cursor-crosshair
- @click + @touchend.prevent: compute offset as fraction of element size via getBoundingClientRect(); emit { x, y } clamped to 0–1
- Render accent-colored dot: w-3 h-3 rounded-full absolute positioned with left: x*100%, top: y*100%, transform: translate(-50%, -50%)

MachineEditor component

Props: machineId: string

Reads useMachinesStore() and useDailyPalette() directly.

- Collapsed row: machine name (left) + currentWeight kg (right) + chevron (rotates on expand)
- expanded local ref; tap row toggles it
- Expanded section (smooth max-height transition):
  - LocationPicker v-model → calls machinesStore.updateMachine(id, { locationX, locationY }) immediately on each emit
  - Text input: Name; number inputs: Current Weight, Step Size (inputmode="decimal")
  - Local copies of name/weight/step; Save button calls updateMachine() with all three
  - Delete button: confirmingDelete boolean ref — first tap shows "Tap again to confirm", second tap calls deleteMachine() and collapses; auto-reset after 3 s via setTimeout

Machines section in SettingsView

- <MachineEditor v-for="machine in machinesStore.machines" :key="machine.id" :machine-id="machine.id" />
- Track expandedMachineId ref in SettingsView; pass as prop to auto-expand newly added row
- "Add Machine" button: machinesStore.addMachine({ name: 'New Machine', locationX: 0.5, locationY: 0.5, currentWeight: 0, stepSize: 2.5 }) → set expandedMachineId to the new machine's id

---

Part 2 — Fitness checks section + FitnessView Settings button

New file: src/components/FitnessCheckEditor.vue
Modified: src/views/SettingsView.vue, src/views/FitnessView.vue

FitnessCheckEditor component

Props: checkId: string

Same inline-expand pattern as MachineEditor, no LocationPicker:

- Collapsed row: check name (left) + unit (right) + chevron
- Expanded fields: Name, Unit (text), Step Size, Min, Max (number inputs)
- Local copies; Save button calls fitnessStore.updateCheck()
- Delete-with-confirm (same two-tap pattern)

Fitness Checks section in SettingsView

- <FitnessCheckEditor v-for="check in fitnessStore.checks" :key="check.id" :check-id="check.id" />
- expandedCheckId ref + "Add Fitness Check" button: fitnessStore.addCheck({ name: 'New Check', unit: 'reps', stepSize: 1, min: 0, max: 100 })

FitnessView Settings button

Spec §5.3 requires two buttons top-right: Settings (gear) + Back. Add to the existing header div:

- Add <button @click.stop="goToSettings"> with Settings icon (lucide) alongside the existing ChevronDown div
- goToSettings(): uiStore.transitionDirection = 'right' → router.push('/settings')
- .stop prevents bubbling to the header's goBack click handler

---

Part 3 — Data import/export

Modified: src/views/SettingsView.vue, src/stores/ui.ts

uiStore addition

Add const lastExportDate = useLocalStorage<string>('gymdeck-last-export', '') and include in return.

Export

function exportData() {
const payload = {
machines: machinesStore.machines,
sessions: sessionsStore.sessions,
fitnessChecks: fitnessStore.checks,
fitnessMeasurements: fitnessStore.measurements,
}
const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `gymdeck-backup-${toDateString(new Date())}.json`
a.click()
URL.revokeObjectURL(url)
uiStore.lastExportDate = toDateString(new Date())
}
Uses toDateString from @/utils/date.

Import

- Hidden <input ref="fileInput" type="file" accept=".json" @change="onFileSelected" />
- "Import" button: fileInput.value.click()
- onFileSelected: FileReader.readAsText → JSON.parse → validate all four top-level keys exist and are arrays → set importPayload ref + confirmingImport = true; on parse/validation error set importError string ref
- Inline confirm row: "This will overwrite all data." + Cancel + Confirm buttons
- On confirm: write all four arrays to stores; clear confirmingImport/importPayload
- "Last exported: DD.MM.YYYY" line shown when uiStore.lastExportDate is set (format with date.slice(8,10) + '.' + date.slice(5,7) + '.' + date.slice(0,4))

---

Verification

1.  vue-tsc --noEmit — zero errors after each part
2.  Part 1: Add machine → appears in card stack; edit name/weight/step → persists; edit location → dot moves and persists; delete with two-tap confirm → machine gone
3.  Part 2: Add fitness check → appears in FitnessView; edit min/max → DrumRollPicker range updates on next open; FitnessView Settings button navigates right to Settings, back returns to Fitness
4.  Part 3: Export downloads valid JSON; re-import → all data identical; import of malformed JSON shows error without touching stores
