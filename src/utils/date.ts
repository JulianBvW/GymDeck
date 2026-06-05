/** Format a Date as "YYYY-MM-DD" using local (German) time — never UTC. */
export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Return the Monday of the week containing dateStr ("YYYY-MM-DD"), in local time. */
export function startOfWeek(dateStr: string): string {
  // Parse as local midnight — bare "YYYY-MM-DD" is treated as UTC by the spec
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() // 0=Sun, 1=Mon … 6=Sat
  const diff = day === 0 ? 6 : day - 1 // days back to Monday
  d.setDate(d.getDate() - diff)
  return toDateString(d)
}
