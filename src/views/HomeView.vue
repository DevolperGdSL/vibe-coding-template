<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import HabitCalendar from '@/components/HabitCalendar.vue'
import { monthRange, parseISODate, todayISO } from '@/lib/dates'
import { occursOn } from '@/lib/schedule'
import { useHabits } from '@/composables/useHabits'
import { useProfile } from '@/composables/useCharacter'

const { habits, marks, loading, error, fetchHabits, fetchMarks, toggleMark } = useHabits()
const { profile, fetchProfile } = useProfile()

const today = todayISO()
const selected = ref(today)
const view = ref({ year: new Date().getFullYear(), month: new Date().getMonth() })

const due = computed(() => habits.value.filter((habit) => occursOn(habit, selected.value)))
const markedIds = computed(
  () => new Set(marks.value.filter((mark) => mark.date === selected.value).map((mark) => mark.habitId))
)
const dayDone = computed(() => due.value.filter((habit) => markedIds.value.has(habit.id)).length)
const dayXp = computed(() =>
  marks.value.filter((mark) => mark.date === selected.value).reduce((sum, mark) => sum + mark.weight, 0)
)
const dayRatio = computed(() => (due.value.length ? Math.round((dayDone.value / due.value.length) * 100) : 0))
const future = computed(() => selected.value > today)
const dayLabel = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(
    parseISODate(selected.value)
  )
)
const initial = computed(() => (profile.value?.name || 'A').slice(0, 1).toUpperCase())

function shiftMonth(delta) {
  const date = new Date(view.value.year, view.value.month + delta, 1)
  view.value = { year: date.getFullYear(), month: date.getMonth() }
}

function selectDay(iso) {
  selected.value = iso
  const date = parseISODate(iso)
  if (date.getMonth() !== view.value.month || date.getFullYear() !== view.value.year) {
    view.value = { year: date.getFullYear(), month: date.getMonth() }
  }
}

async function onToggle(habit) {
  if (future.value) return
  try {
    await toggleMark(habit.id, selected.value)
    await fetchProfile()
  } catch {
    return
  }
}

watch(
  view,
  () => {
    const { from, to } = monthRange(view.value.year, view.value.month)
    fetchMarks(from, to).catch(() => {})
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  fetchHabits().catch(() => {})
  fetchProfile()
})
</script>

<template>
  <div class="page">
    <section class="pixel-panel welcome">
      <img
        v-if="profile?.avatar"
        class="avatar"
        :src="profile.avatar"
        alt=""
      >
      <span
        v-else
        class="avatar placeholder"
      >{{ initial }}</span>
      <div>
        <p class="kicker">
          Crônica do dia
        </p>
        <h1>Bem-vindo, {{ profile?.name || 'Aventureiro' }}</h1>
        <p class="hint">
          {{
            profile?.activeHero
              ? `As marcas rendem XP para ${profile.activeHero.name}. O XP total da conta não muda de herói.`
              : 'Recrute um herói no Hall para receber o XP das marcas.'
          }}
        </p>
      </div>
    </section>

    <HabitCalendar
      :model-value="selected"
      :year="view.year"
      :month="view.month"
      :habits="habits"
      :marks="marks"
      @select="selectDay"
      @shift="shiftMonth"
    />

    <section class="pixel-panel">
      <header class="day-head">
        <div>
          <p class="kicker">
            Informações
          </p>
          <h2>{{ dayLabel }}</h2>
        </div>
        <p class="xp">
          +{{ dayXp }} XP
        </p>
      </header>
      <div
        class="bar"
        role="progressbar"
        :aria-valuenow="dayDone"
        :aria-valuemax="due.length || 0"
      >
        <span :style="{ width: `${dayRatio}%` }" />
      </div>
      <p class="hint">
        {{ due.length ? `${dayDone}/${due.length} tarefas · ${dayRatio}%` : 'Nenhuma tarefa neste dia' }}
      </p>
      <p
        v-if="error"
        class="error"
      >
        {{ error.message }}
      </p>
      <p
        v-if="future"
        class="hint"
      >
        Dia futuro: dá para ver, não para marcar.
      </p>
      <p
        v-if="loading"
        class="hint"
      >
        Carregando…
      </p>
      <ul class="list">
        <li
          v-for="habit in due"
          :key="habit.id"
          class="task"
        >
          <UCheckbox
            :model-value="markedIds.has(habit.id)"
            :disabled="future"
            @update:model-value="onToggle(habit)"
          />
          <div>
            <strong>{{ habit.title }}</strong>
            <span class="meta">{{ habit.tagIcon }} {{ habit.tagName }} · {{ habit.weight }} XP</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  gap: 16px;
  align-items: center;
}

.welcome h1 {
  margin: 4px 0;
  font-size: 22px;
}

.day-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.day-head h2 {
  margin: 0;
  font-size: 16px;
  text-transform: capitalize;
}

.xp {
  margin: 0;
  color: var(--gold);
}

.bar {
  height: 14px;
  margin: 12px 0 6px;
  background: #0c0f16;
  border: 3px solid #0c0f16;
}

.bar span {
  display: block;
  height: 100%;
  background: repeating-linear-gradient(90deg, #7dcea0 0 8px, #5eae80 8px 10px);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.task {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px;
  background: #1b2130;
  border: 3px solid #0c0f16;
}

.task strong,
.meta {
  display: block;
}

.meta {
  color: var(--muted);
  font-size: 12px;
}
</style>
