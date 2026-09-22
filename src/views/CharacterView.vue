<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import PixelCharacter from '@/components/PixelCharacter.vue'
import { ATTRS } from '@/lib/heroes'
import { STAGES } from '@/lib/sprites'
import { useHeroes } from '@/composables/useCharacter'
import { notify } from '@/composables/useToast'

const { heroes, loading, error, fetchHeroes, spend } = useHeroes()
const hero = computed(() => heroes.value.find((item) => item.active) || null)
const ratio = computed(() => {
  if (!hero.value) return 0
  if (!hero.value.xpForNext) return 100
  return Math.round((hero.value.xpIntoLevel / hero.value.xpForNext) * 100)
})

async function onSpend(id, attr, delta) {
  if (await spend(id, attr, delta)) notify(delta > 0 ? 'Atributo aumentado' : 'Atributo reduzido')
  else notify(error.value?.message || 'Não foi possível alterar', 'bad')
}

onMounted(fetchHeroes)
</script>

<template>
  <section class="page sheet">
    <div class="pixel-panel stage">
      <p
        v-if="loading"
        class="hint"
      >
        Carregando…
      </p>
      <template v-if="hero">
        <PixelCharacter
          :class-id="hero.classId"
          :race-id="hero.raceId"
          :level="hero.level"
          :scale="5"
        />
        <div class="copy">
          <p class="kicker">
            {{ hero.raceLabel }} · {{ hero.classLabel }}
          </p>
          <h1>{{ hero.name }}</h1>
          <p>Nv {{ hero.level }} · {{ hero.title }}</p>
          <div
            class="bar"
            role="progressbar"
            :aria-valuenow="hero.xpIntoLevel"
            :aria-valuemax="hero.xpForNext || hero.xpIntoLevel"
          >
            <span :style="{ width: `${ratio}%` }" />
          </div>
          <p class="hint">
            {{
              hero.level >= 100
                ? `Nível máximo · ${hero.xp} XP do herói`
                : `${hero.xpIntoLevel}/${hero.xpForNext} XP neste nível · ${hero.xp} no herói`
            }}
          </p>
        </div>
      </template>
      <p v-else-if="!loading">
        Nenhum herói ativo.
        <RouterLink to="/hall">
          Ir ao Hall
        </RouterLink>
      </p>
      <p
        v-if="error"
        class="error"
      >
        {{ error.message }}
      </p>
    </div>

    <div
      v-if="hero"
      class="pixel-panel"
    >
      <header class="split">
        <h2>Ficha</h2>
        <p class="xp">
          Pontos: {{ hero.unspent }}
        </p>
      </header>
      <ul class="stats">
        <li
          v-for="attr in ATTRS"
          :key="attr.id"
        >
          <span>{{ attr.label }}</span>
          <strong>{{ hero.stats[attr.id] }}</strong>
          <small>base {{ hero.bases[attr.id] }} + {{ hero.spent[attr.id] }}</small>
          <div class="actions">
            <UButton
              size="xs"
              variant="ghost"
              :disabled="hero.spent[attr.id] < 1"
              @click="onSpend(hero.id, attr.id, -1)"
            >
              -
            </UButton>
            <UButton
              size="xs"
              :disabled="hero.unspent < 1"
              @click="onSpend(hero.id, attr.id, 1)"
            >
              +
            </UButton>
          </div>
        </li>
      </ul>
      <ul class="unlocks">
        <li
          v-for="item in STAGES"
          :key="item.level"
          :class="{ on: hero.level >= item.level }"
        >
          <span>Nv {{ item.level }}</span>
          <strong>{{ item.label }}</strong>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.sheet {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.copy {
  width: min(100%, 360px);
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 22px;
}

.split,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.xp {
  color: var(--gold);
}

.bar {
  height: 14px;
  margin: 10px 0;
  background: #0c0f16;
  border: 3px solid #0c0f16;
}

.bar span {
  display: block;
  height: 100%;
  background: repeating-linear-gradient(90deg, #e6c15a 0 8px, #c9a24a 8px 10px);
}

.stats,
.unlocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.stats li,
.unlocks li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 8px;
  align-items: center;
  padding: 8px;
  background: #1b2130;
  border: 3px solid #0c0f16;
}

.stats small {
  color: var(--muted);
}

.unlocks li {
  color: var(--muted);
}

.unlocks li.on {
  color: var(--ink);
  box-shadow: inset 3px 0 0 var(--gold);
}

@media (max-width: 800px) {
  .sheet {
    grid-template-columns: 1fr;
  }
}
</style>
