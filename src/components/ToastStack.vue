<script setup>
import { toasts } from '@/composables/useToast'
</script>

<template>
  <div class="toasts">
    <p
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="toast.tone"
    >
      {{ toast.message }}
    </p>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(280px, calc(100% - 32px));
}

.toast {
  margin: 0;
  padding: 10px 12px;
  color: #141820;
  background: var(--gold);
  border: 3px solid #000;
  box-shadow: 4px 4px 0 #000;
}

.toast.bad {
  color: #f4e7c8;
  background: #8a3040;
}
</style>
