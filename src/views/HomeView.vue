<script setup>
import { onMounted, ref } from 'vue'
import { useTasks } from '@/composables/useTasks'

const { tasks, loading, fetchTasks, addTask, toggleTask, deleteTask } = useTasks()
const newTitle = ref('')

onMounted(fetchTasks)

async function onAdd() {
  if (!newTitle.value.trim()) return
  await addTask(newTitle.value.trim())
  newTitle.value = ''
}
</script>

<template>
  <div class="max-w-xl mx-auto p-8 space-y-4">
    <h1 class="text-2xl font-bold">Vibe Coding</h1>
    <p class="text-sm text-gray-500">
      Tasks are persisted through a simulated API (see src/api) backed by localStorage.
    </p>

    <div class="flex gap-2">
      <UInput v-model="newTitle" placeholder="New task" @keyup.enter="onAdd" />
      <UButton @click="onAdd">Add</UButton>
    </div>

    <ul class="space-y-2">
      <li v-for="task in tasks" :key="task.id" class="flex items-center gap-2">
        <UCheckbox
          :model-value="task.done"
          @update:model-value="(value) => toggleTask(task.id, value)"
        />
        <span :class="{ 'line-through text-gray-400': task.done }">{{ task.title }}</span>
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          class="ml-auto"
          @click="deleteTask(task.id)"
        >
          Remove
        </UButton>
      </li>
    </ul>

    <p v-if="loading" class="text-sm text-gray-400">Loading…</p>
  </div>
</template>
