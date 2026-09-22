import { ref } from 'vue'

export const toasts = ref([])

export function notify(message, tone = 'ok') {
  const id = crypto.randomUUID()
  toasts.value = [...toasts.value, { id, message, tone }]
  setTimeout(() => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }, 2600)
}
