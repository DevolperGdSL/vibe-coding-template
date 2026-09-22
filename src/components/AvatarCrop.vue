<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' }
})

const emit = defineEmits(['cancel', 'confirm'])
const frame = 240
const zoom = ref(1)
const offset = ref({ x: 0, y: 0 })
const image = ref(null)
let dragging = null

function coverScale() {
  if (!image.value) return 1
  return Math.max(frame / image.value.width, frame / image.value.height)
}

function displaySize() {
  const scale = coverScale() * zoom.value
  return {
    width: image.value.width * scale,
    height: image.value.height * scale,
    scale
  }
}

function clamp() {
  if (!image.value) return
  const { width, height } = displaySize()
  offset.value = {
    x: Math.min(0, Math.max(frame - width, offset.value.x)),
    y: Math.min(0, Math.max(frame - height, offset.value.y))
  }
}

function center() {
  if (!image.value) return
  const { width, height } = displaySize()
  offset.value = { x: (frame - width) / 2, y: (frame - height) / 2 }
  clamp()
}

watch(
  () => props.src,
  (src) => {
    zoom.value = 1
    if (!src) return
    const next = new Image()
    next.onload = () => {
      image.value = next
      center()
    }
    next.src = src
  },
  { immediate: true }
)

function onZoom(event) {
  const next = Number(event.target.value)
  const ratio = next / zoom.value
  const cx = frame / 2
  const cy = frame / 2
  offset.value = {
    x: cx - (cx - offset.value.x) * ratio,
    y: cy - (cy - offset.value.y) * ratio
  }
  zoom.value = next
  clamp()
}

function onDown(event) {
  dragging = { x: event.clientX, y: event.clientY }
  event.currentTarget.setPointerCapture(event.pointerId)
}

function onMove(event) {
  if (!dragging) return
  offset.value = {
    x: offset.value.x + event.clientX - dragging.x,
    y: offset.value.y + event.clientY - dragging.y
  }
  dragging = { x: event.clientX, y: event.clientY }
  clamp()
}

function onUp() {
  dragging = null
}

function confirmCrop() {
  if (!image.value) return
  const canvas = document.createElement('canvas')
  canvas.width = 192
  canvas.height = 192
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  const { scale } = displaySize()
  ctx.drawImage(
    image.value,
    -offset.value.x / scale,
    -offset.value.y / scale,
    frame / scale,
    frame / scale,
    0,
    0,
    192,
    192
  )
  emit('confirm', canvas.toDataURL('image/png'))
}

onBeforeUnmount(() => {
  image.value = null
})
</script>

<template>
  <div
    class="crop-back"
    @click.self="emit('cancel')"
  >
    <div
      class="crop"
      role="dialog"
      aria-modal="true"
      aria-label="Recortar ícone"
    >
      <h2>Recortar ícone</h2>
      <p class="hint">
        Arraste e aproxime para encaixar no quadrado.
      </p>
      <div
        class="frame"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        <img
          v-if="image"
          :src="src"
          alt=""
          draggable="false"
          :style="{
            width: `${displaySize().width}px`,
            height: `${displaySize().height}px`,
            transform: `translate(${offset.x}px, ${offset.y}px)`
          }"
        >
      </div>
      <label>
        Zoom
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          :value="zoom"
          @input="onZoom"
        >
      </label>
      <div class="actions">
        <button
          type="button"
          @click="confirmCrop"
        >
          Usar recorte
        </button>
        <button
          type="button"
          class="danger"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crop-back {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(0 0 0 / 72%);
}

.crop {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(320px, 100%);
  padding: 16px;
  background: #1c2333;
  border: 4px solid #000;
  box-shadow: 6px 6px 0 #000;
}

.crop h2,
.hint {
  margin: 0;
}

.frame {
  width: 240px;
  height: 240px;
  overflow: hidden;
  cursor: grab;
  background: #000;
  border: 4px solid var(--gold);
  touch-action: none;
}

.frame img {
  display: block;
  max-width: none;
  image-rendering: pixelated;
  user-select: none;
  pointer-events: none;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>
