import { parseISODate } from './dates.js'

export const REPEAT_OPTIONS = [
  { id: 'once', label: 'Uma vez' },
  { id: 'daily', label: 'Diariamente' },
  { id: 'weekly', label: 'Semanalmente' },
  { id: 'monthly', label: 'Mensalmente' }
]

export const WEEKDAYS = [
  { id: 0, short: 'D', label: 'Dom' },
  { id: 1, short: 'S', label: 'Seg' },
  { id: 2, short: 'T', label: 'Ter' },
  { id: 3, short: 'Q', label: 'Qua' },
  { id: 4, short: 'Q', label: 'Qui' },
  { id: 5, short: 'S', label: 'Sex' },
  { id: 6, short: 'S', label: 'Sáb' }
]

export function occursOn(habit, iso) {
  const repeat = habit.repeat || 'daily'
  const anchor = habit.anchorDate
  if (!anchor) return repeat === 'daily'
  if (repeat === 'once') return iso === anchor
  if (iso < anchor) return false
  if (repeat === 'daily') return true
  if (repeat === 'weekly') {
    const days = Array.isArray(habit.weekdays) ? habit.weekdays.map(Number) : []
    return days.includes(parseISODate(iso).getDay())
  }
  if (repeat === 'monthly') {
    const date = parseISODate(iso)
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const wanted = Number(habit.monthDay) || parseISODate(anchor).getDate()
    return date.getDate() === Math.min(wanted, last)
  }
  return false
}

export function repeatLabel(habit) {
  if (habit.repeat === 'once') return `Uma vez · ${habit.anchorDate}`
  if (habit.repeat === 'weekly') {
    const names = WEEKDAYS.filter((day) => habit.weekdays?.includes(day.id)).map((day) => day.label)
    return `Semanal · ${names.join(', ') || '—'}`
  }
  if (habit.repeat === 'monthly') return `Mensal · dia ${habit.monthDay}`
  return `Todo dia · desde ${habit.anchorDate}`
}
