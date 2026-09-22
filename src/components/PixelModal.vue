<script setup>
defineProps({
  title: { type: String, required: true }
})

const emit = defineEmits(['close'])
</script>

<template>
  <div
    class="modal-back"
    @click.self="emit('close')"
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
    >
      <header class="modal-head">
        <h2>{{ title }}</h2>
        <button
          type="button"
          class="modal-close"
          @click="emit('close')"
        >
          Fechar
        </button>
      </header>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.modal-back {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(8 10 14 / 72%);
}

.modal {
  width: min(560px, 100%);
  max-height: min(88vh, 760px);
  overflow: auto;
  padding: 16px;
  background: #2a2118;
  border: 4px solid #120e0a;
  box-shadow: 8px 8px 0 #120e0a;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.modal-head h2 {
  margin: 0;
  font-size: 16px;
}

.modal-close {
  padding: 4px 8px;
  color: #f3e6c8;
  background: #1b2130;
  border: 3px solid #0c0f16;
  cursor: pointer;
}
</style>
