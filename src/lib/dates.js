export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(iso, amount) {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + amount)
  return toISODate(date)
}

export function todayISO() {
  return toISODate(new Date())
}

export function isValidDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  return toISODate(parseISODate(iso)) === iso
}

export function monthRange(year, monthIndex) {
  return {
    from: toISODate(new Date(year, monthIndex, 1)),
    to: toISODate(new Date(year, monthIndex + 1, 0))
  }
}

export function streakFromDates(dates, today = todayISO()) {
  const set = new Set(dates)
  let cursor = today
  if (!set.has(cursor)) cursor = addDays(cursor, -1)
  let count = 0
  while (set.has(cursor)) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}
