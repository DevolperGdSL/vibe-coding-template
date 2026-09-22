import { ref } from 'vue'
import { tasksApi } from '@/api/resources/tasks'

export function useTasks() {
  const tasks = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchTasks() {
    loading.value = true
    error.value = null
    try {
      tasks.value = await tasksApi.list()
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function addTask(title) {
    await tasksApi.create({ title, done: false })
    await fetchTasks()
  }

  async function toggleTask(id, done) {
    await tasksApi.update(id, { done })
    await fetchTasks()
  }

  async function deleteTask(id) {
    await tasksApi.remove(id)
    await fetchTasks()
  }

  return { tasks, loading, error, fetchTasks, addTask, toggleTask, deleteTask }
}
