<script setup>
import { onMounted, ref } from 'vue'
import PixelModal from '@/components/PixelModal.vue'
import { todayISO } from '@/lib/dates'
import { TAG_ICONS } from '@/lib/heroes'
import { REPEAT_OPTIONS, WEEKDAYS, repeatLabel } from '@/lib/schedule'
import { useHabits } from '@/composables/useHabits'
import { notify } from '@/composables/useToast'

const {
  habits,
  tags,
  error,
  fetchHabits,
  fetchTags,
  addHabit,
  editHabit,
  deleteHabit,
  addTag,
  editTag,
  deleteTag
} = useHabits()

const tagModal = ref(false)
const habitModal = ref(false)
const pendingDelete = ref(null)
const tagDraft = ref({ id: null, name: '', icon: '🏠' })
const habitDraft = ref(blankHabit())

function blankHabit() {
  const today = todayISO()
  return {
    id: null,
    title: '',
    tagId: '',
    weight: 10,
    repeat: 'once',
    anchorDate: today,
    weekdays: [new Date().getDay()],
    monthDay: new Date().getDate()
  }
}

function openTag(tag) {
  tagDraft.value = tag
    ? { id: tag.id, name: tag.name, icon: tag.icon }
    : { id: null, name: '', icon: '🏠' }
  tagModal.value = true
}

function openHabit(habit) {
  habitDraft.value = habit
    ? {
      id: habit.id,
      title: habit.title,
      tagId: habit.tagId,
      weight: habit.weight,
      repeat: habit.repeat,
      anchorDate: habit.anchorDate,
      weekdays: [...(habit.weekdays || [])],
      monthDay: habit.monthDay || Number(habit.anchorDate.slice(-2))
    }
    : { ...blankHabit(), tagId: tags.value[0]?.id || '' }
  habitModal.value = true
}

function toggleWeekday(id) {
  const days = habitDraft.value.weekdays
  habitDraft.value.weekdays = days.includes(id) ? days.filter((day) => day !== id) : [...days, id]
}

function syncMonthDay() {
  habitDraft.value.monthDay = Number(String(habitDraft.value.anchorDate).slice(-2))
}

async function saveTag() {
  try {
    const payload = { name: tagDraft.value.name, icon: tagDraft.value.icon }
    if (tagDraft.value.id) await editTag(tagDraft.value.id, payload)
    else await addTag(payload)
    tagModal.value = false
    notify(tagDraft.value.id ? 'Tag atualizada' : 'Tag adicionada')
  } catch (err) {
    notify(err.message || 'Não foi possível salvar a tag', 'bad')
  }
}

async function saveHabit() {
  try {
    const payload = {
      title: habitDraft.value.title,
      tagId: habitDraft.value.tagId,
      weight: Number(habitDraft.value.weight),
      repeat: habitDraft.value.repeat,
      anchorDate: habitDraft.value.anchorDate,
      weekdays: habitDraft.value.weekdays,
      monthDay: Number(habitDraft.value.monthDay)
    }
    if (habitDraft.value.id) await editHabit(habitDraft.value.id, payload)
    else await addHabit(payload)
    habitModal.value = false
    notify(habitDraft.value.id ? 'Missão atualizada' : 'Missão pregada')
  } catch (err) {
    notify(err.message || 'Não foi possível salvar a missão', 'bad')
  }
}

async function onDeleteHabit(id) {
  if (pendingDelete.value !== id) {
    pendingDelete.value = id
    return
  }
  try {
    await deleteHabit(id)
    pendingDelete.value = null
    notify('Missão removida')
  } catch (err) {
    notify(err.message || 'Não foi possível remover', 'bad')
  }
}

async function onDeleteTag(id) {
  try {
    await deleteTag(id)
    tagModal.value = false
    notify('Tag removida')
  } catch (err) {
    notify(err.message || 'Não foi possível remover a tag', 'bad')
  }
}

onMounted(() => {
  fetchTags().catch(() => {})
  fetchHabits().catch(() => {})
})
</script>

<template>
  <div class="page tavern">
    <section class="pixel-panel">
      <header class="split">
        <div>
          <p class="kicker">
            Taberna
          </p>
          <h1>Missões e tags</h1>
        </div>
        <div class="actions">
          <UButton @click="openTag(null)">
            Nova tag
          </UButton>
          <UButton @click="openHabit(null)">
            Pregar missão
          </UButton>
        </div>
      </header>
      <ul class="tags">
        <li
          v-for="tag in tags"
          :key="tag.id"
        >
          <button
            type="button"
            class="tag-chip"
            @click="openTag(tag)"
          >
            <span>{{ tag.icon }}</span>
            {{ tag.name }}
          </button>
        </li>
      </ul>
      <p
        v-if="error"
        class="error"
      >
        {{ error.message }}
      </p>
    </section>

    <section class="board">
      <article
        v-for="habit in habits"
        :key="habit.id"
        class="poster"
      >
        <span class="nail" />
        <div class="quest">
          <p class="poster-tag">
            Contrato · {{ habit.tagIcon }} {{ habit.tagName }}
          </p>
          <h2>{{ habit.title }}</h2>
          <p>Quando: {{ repeatLabel(habit) }}</p>
          <p>Recompensa: {{ habit.weight }} XP</p>
          <p class="flavor">
            Cumpra o combinado. A crônica anota quem volta.
          </p>
        </div>
        <div class="actions">
          <UButton
            size="xs"
            @click="openHabit(habit)"
          >
            Editar
          </UButton>
          <UButton
            size="xs"
            class="danger"
            @click="onDeleteHabit(habit.id)"
          >
            {{ pendingDelete === habit.id ? 'Confirmar' : 'Remover' }}
          </UButton>
        </div>
      </article>
      <p
        v-if="!habits.length"
        class="hint"
      >
        Nenhum cartaz pregado.
      </p>
    </section>

    <PixelModal
      v-if="tagModal"
      title="Tag"
      @close="tagModal = false"
    >
      <form
        class="form"
        @submit.prevent="saveTag"
      >
        <label>
          Nome
          <UInput
            v-model="tagDraft.name"
            maxlength="24"
            placeholder="Casa, Escola…"
          />
        </label>
        <p class="kicker">
          Ícone
        </p>
        <div class="icon-grid">
          <button
            v-for="icon in TAG_ICONS"
            :key="icon"
            type="button"
            class="icon"
            :class="{ on: tagDraft.icon === icon }"
            @click="tagDraft.icon = icon"
          >
            {{ icon }}
          </button>
        </div>
        <div class="actions">
          <UButton type="submit">
            Salvar
          </UButton>
          <UButton
            v-if="tagDraft.id"
            class="danger"
            @click="onDeleteTag(tagDraft.id)"
          >
            Remover
          </UButton>
        </div>
      </form>
    </PixelModal>

    <PixelModal
      v-if="habitModal"
      title="Missão"
      @close="habitModal = false"
    >
      <form
        class="poster form"
        @submit.prevent="saveHabit"
      >
        <span class="nail" />
        <label>
          Título
          <UInput
            v-model="habitDraft.title"
            maxlength="60"
            placeholder="Beber água"
          />
        </label>
        <label>
          Tag
          <select
            v-model="habitDraft.tagId"
            class="pixel-select"
          >
            <option
              v-for="tag in tags"
              :key="tag.id"
              :value="tag.id"
            >
              {{ tag.icon }} {{ tag.name }}
            </option>
          </select>
        </label>
        <label>
          Peso (XP)
          <UInput
            v-model="habitDraft.weight"
            type="number"
            min="1"
            max="100"
          />
        </label>
        <label>
          Dia
          <UInput
            v-model="habitDraft.anchorDate"
            type="date"
            @change="syncMonthDay"
          />
        </label>
        <fieldset>
          <legend>Repete</legend>
          <label
            v-for="option in REPEAT_OPTIONS"
            :key="option.id"
            class="choice"
          >
            <input
              v-model="habitDraft.repeat"
              type="radio"
              name="repeat"
              :value="option.id"
            >
            {{ option.label }}
          </label>
        </fieldset>
        <div
          v-if="habitDraft.repeat === 'weekly'"
          class="week"
        >
          <button
            v-for="day in WEEKDAYS"
            :key="day.id"
            type="button"
            class="icon"
            :class="{ on: habitDraft.weekdays.includes(day.id) }"
            @click="toggleWeekday(day.id)"
          >
            {{ day.label }}
          </button>
        </div>
        <label v-if="habitDraft.repeat === 'monthly'">
          Dia do mês
          <UInput
            v-model="habitDraft.monthDay"
            type="number"
            min="1"
            max="31"
          />
        </label>
        <UButton type="submit">
          Pregar missão
        </UButton>
      </form>
    </PixelModal>
  </div>
</template>

<style scoped>
.tavern h1 {
  margin: 4px 0 0;
  font-size: 22px;
}

.split,
.actions,
.tags,
.week {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.split {
  justify-content: space-between;
  margin-bottom: 12px;
}

.tags {
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag-chip,
.icon,
.pixel-select {
  color: var(--ink);
  background: #1b2130;
  border: 3px solid #0c0f16;
  cursor: pointer;
}

.tag-chip,
.icon {
  padding: 6px 8px;
}

.icon.on,
.tag-chip:hover {
  background: var(--gold);
  color: #1a120c;
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.poster {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 210px;
  padding: 22px 16px 16px;
  overflow: hidden;
  color: #3b2918;
  background: #f3d7a4;
  border: 4px solid #8a6232;
  box-shadow: 6px 6px 0 #000;
}

.quest {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flavor {
  font-size: 12px;
}

.poster h2,
.poster p,
.poster strong {
  margin: 0;
}

.poster-tag {
  font-size: 13px;
}

.nail {
  position: absolute;
  top: 8px;
  left: 50%;
  width: 10px;
  height: 10px;
  background: #8a7344;
  border: 2px solid #3a2a1c;
  transform: translateX(-50%);
}

.actions {
  position: relative;
  z-index: 1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form label,
.choice {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.choice {
  flex-direction: row;
  align-items: center;
}

fieldset {
  margin: 0;
  padding: 8px;
  border: 3px solid #8a6232;
}

.icon-grid,
.week {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pixel-select {
  padding: 8px;
}
</style>
