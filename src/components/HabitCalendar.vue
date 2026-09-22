<script setup>
import { computed } from 'vue'
import { toISODate } from '@/lib/dates'
import { occursOn } from '@/lib/schedule'

const props = defineProps({
  modelValue: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  habits: { type: Array, default: () => [] },
  marks: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'shift'])
const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const today = toISODate(new Date())

const label = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(props.year, props.month, 1)
  )
)

const cells = computed(() => {
  const first = new Date(props.year, props.month, 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const done = new Set(props.marks.map((mark) => `${mark.habitId}:${mark.date}`))
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const iso = toISODate(date)
    const due = props.habits.filter((habit) => occursOn(habit, iso))
    const finished = due.filter((habit) => done.has(`${habit.id}:${iso}`)).length
    return {
      iso,
      day: date.getDate(),
      inMonth: date.getMonth() === props.month,
      due: due.length,
      finished,
      ratio: due.length ? finished / due.length : 0
    }
  })
})
</script>

<template>
  <section class="pixel-panel calendar">
    <header class="calendar-head">
      <UButton
        size="xs"
        variant="ghost"
        @click="emit('shift', -1)"
      >
        ◀
      </UButton>
      <h2>{{ label }}</h2>
      <UButton
        size="xs"
        variant="ghost"
        @click="emit('shift', 1)"
      >
        ▶
      </UButton>
    </header>
    <div class="weekdays">
      <span
        v-for="(day, index) in weekdays"
        :key="index"
      >{{ day }}</span>
    </div>
    <div class="grid">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        class="day"
        :class="{
          out: !cell.inMonth,
          on: cell.iso === modelValue,
          today: cell.iso === today
        }"
        @click="emit('select', cell.iso)"
      >
        <span>{{ cell.day }}</span>
        <i
          v-if="cell.due"
          class="dot"
          :class="{ full: cell.ratio >= 1 }"
        />
      </button>
    </div>
  </section>
</template>

<style scoped>
.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.calendar-head h2 {
  margin: 0;
  font-size: 14px;
  text-transform: capitalize;
}

.weekdays,
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.weekdays {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 11px;
  text-align: center;
}

.day {
  position: relative;
  min-height: 42px;
  padding: 4px;
  color: var(--ink);
  background: #1b2130;
  border: 3px solid #0c0f16;
  cursor: pointer;
}

.day.out {
  color: #667084;
}

.day.on {
  background: #314056;
  box-shadow: inset 0 0 0 2px var(--gold);
}

.day.today {
  color: var(--gold);
}

.dot {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 6px;
  height: 6px;
  background: var(--gold);
}

.dot.full {
  background: var(--accent);
}
</style>
