<script setup>
import { computed, onMounted, ref } from 'vue'
import PixelCharacter from '@/components/PixelCharacter.vue'
import PixelModal from '@/components/PixelModal.vue'
import { CLASSES, RACES } from '@/lib/heroes'
import { useHeroes } from '@/composables/useCharacter'
import { notify } from '@/composables/useToast'

const { heroes, error, fetchHeroes, recruit, activate, removeHero } = useHeroes()
const open = ref(false)
const pendingDelete = ref(null)
const draft = ref(blank())

const options = computed(() => (heroes.value.length ? CLASSES : CLASSES.filter((item) => item.starter)))

function blank(classId = 'guerreiro') {
  return { name: '', classId, raceId: 'humano' }
}

function start(classId) {
  draft.value = blank(classId)
  open.value = true
}

async function onRecruit() {
  if (await recruit(draft.value)) {
    open.value = false
    notify('Herói recrutado')
    return
  }
  notify(error.value?.message || 'Não foi possível recrutar', 'bad')
}

async function onActivate(id) {
  if (await activate(id)) notify('Herói assumido')
  else notify(error.value?.message || 'Não foi possível assumir', 'bad')
}

async function onDelete(id) {
  if (pendingDelete.value !== id) {
    pendingDelete.value = id
    return
  }
  if (await removeHero(id)) {
    pendingDelete.value = null
    notify('Herói dispensado')
    return
  }
  notify(error.value?.message || 'Não foi possível dispensar', 'bad')
}

onMounted(fetchHeroes)
</script>

<template>
  <div class="page">
    <section class="pixel-panel">
      <p class="kicker">
        Hall dos Heróis
      </p>
      <h1>Escolha quem sobe de nível</h1>
      <p class="hint">
        Cada herói guarda o próprio XP. Trocar de herói não mexe no XP total da conta.
        Tank e clérigo entram depois do primeiro recrutamento.
      </p>
      <p
        v-if="error"
        class="error"
      >
        {{ error.message }}
      </p>
    </section>

    <section
      v-if="!heroes.length"
      class="roster"
    >
      <button
        v-for="item in options"
        :key="item.id"
        type="button"
        class="pixel-panel hero-card"
        @click="start(item.id)"
      >
        <PixelCharacter
          :class-id="item.id"
          :level="1"
          :scale="3"
        />
        <strong>{{ item.label }}</strong>
        <span>Começar</span>
      </button>
    </section>

    <section
      v-else
      class="roster"
    >
      <article
        v-for="hero in heroes"
        :key="hero.id"
        class="pixel-panel hero-card"
        :class="{ active: hero.active }"
      >
        <PixelCharacter
          :class-id="hero.classId"
          :race-id="hero.raceId"
          :level="hero.level"
          :scale="3"
        />
        <strong>{{ hero.name }}</strong>
        <span>{{ hero.raceLabel }} · {{ hero.classLabel }}</span>
        <span>Nv {{ hero.level }} · {{ hero.xp }} XP</span>
        <div class="actions">
          <UButton
            v-if="!hero.active"
            size="xs"
            @click="onActivate(hero.id)"
          >
            Assumir
          </UButton>
          <UButton
            size="xs"
            class="danger"
            @click="onDelete(hero.id)"
          >
            {{ pendingDelete === hero.id ? 'Confirmar' : 'Dispensar' }}
          </UButton>
        </div>
      </article>
      <button
        type="button"
        class="pixel-panel recruit"
        @click="start('guerreiro')"
      >
        Recrutar
      </button>
    </section>

    <PixelModal
      v-if="open"
      title="Recrutar herói"
      @close="open = false"
    >
      <form
        class="form"
        @submit.prevent="onRecruit"
      >
        <label>
          Nome
          <UInput
            v-model="draft.name"
            maxlength="24"
            placeholder="Nome do herói"
          />
        </label>
        <p class="kicker">
          Classe
        </p>
        <div class="choices">
          <button
            v-for="item in options"
            :key="item.id"
            type="button"
            class="choice"
            :class="{ on: draft.classId === item.id }"
            @click="draft.classId = item.id"
          >
            <PixelCharacter
              :class-id="item.id"
              :race-id="draft.raceId"
              :level="8"
              :scale="2"
            />
            {{ item.label }}
          </button>
        </div>
        <p class="kicker">
          Raça
        </p>
        <div class="choices">
          <button
            v-for="race in RACES"
            :key="race.id"
            type="button"
            class="choice"
            :class="{ on: draft.raceId === race.id }"
            @click="draft.raceId = race.id"
          >
            {{ race.label }}
          </button>
        </div>
        <UButton type="submit">
          Recrutar
        </UButton>
      </form>
    </PixelModal>
  </div>
</template>

<style scoped>
h1 {
  margin: 4px 0;
  font-size: 22px;
}

.roster {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.hero-card,
.recruit {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  text-align: center;
  color: var(--ink);
}

.hero-card.active {
  box-shadow: inset 0 0 0 3px var(--gold), 4px 4px 0 #0c0f16;
}

.recruit {
  justify-content: center;
  min-height: 180px;
  cursor: pointer;
  background: #1b2130;
}

.actions,
.choices,
.form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form {
  flex-direction: column;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.choice {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 6px;
  color: var(--ink);
  background: #1b2130;
  border: 3px solid #0c0f16;
  cursor: pointer;
}

.choice.on {
  background: var(--gold);
  color: #1a120c;
}
</style>
