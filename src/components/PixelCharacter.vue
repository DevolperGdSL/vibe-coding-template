<script setup>
import { computed } from 'vue'
import { pixelsForHero } from '@/lib/sprites'

const props = defineProps({
  level: { type: Number, default: 1 },
  classId: { type: String, default: 'guerreiro' },
  raceId: { type: String, default: 'humano' },
  scale: { type: Number, default: 4 }
})

const rows = computed(() => pixelsForHero({
  level: props.level,
  classId: props.classId,
  raceId: props.raceId
}))
</script>

<template>
  <div
    class="sprite"
    :style="{ '--px': `${scale}px` }"
    role="img"
    aria-label="Personagem"
  >
    <div
      v-for="(row, y) in rows"
      :key="y"
      class="sprite-row"
    >
      <span
        v-for="(color, x) in row"
        :key="x"
        class="sprite-px"
        :style="{ background: color || 'transparent' }"
      />
    </div>
  </div>
</template>

<style scoped>
.sprite {
  display: inline-flex;
  flex-direction: column;
  image-rendering: pixelated;
  background:
    linear-gradient(#243044, #243044) 0 0 / 8px 8px,
    #1a2030;
  border: 4px solid #0c0f16;
  box-shadow: 4px 4px 0 #0c0f16;
  padding: 8px;
}

.sprite-row {
  display: flex;
  height: var(--px);
}

.sprite-px {
  width: var(--px);
  height: var(--px);
  flex: none;
}
</style>
