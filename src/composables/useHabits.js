import { ref } from 'vue'
import { habitsApi, tagsApi } from '@/api/resources/habits'

export function useHabits() {
  const habits = ref([])
  const tags = ref([])
  const marks = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function run(fn) {
    error.value = null
    try {
      return await fn()
    } catch (err) {
      error.value = err
      throw err
    }
  }

  function fetchHabits() {
    return run(async () => {
      loading.value = true
      try {
        habits.value = await habitsApi.list()
      } finally {
        loading.value = false
      }
    })
  }

  function fetchTags() {
    return run(async () => {
      tags.value = await tagsApi.list()
    })
  }

  function fetchMarks(from, to) {
    return run(async () => {
      marks.value = await habitsApi.marks(from, to)
    })
  }

  function addHabit(data) {
    return run(async () => {
      await habitsApi.create(data)
      habits.value = await habitsApi.list()
    })
  }

  function editHabit(id, patch) {
    return run(async () => {
      await habitsApi.update(id, patch)
      habits.value = await habitsApi.list()
    })
  }

  function deleteHabit(id) {
    return run(async () => {
      await habitsApi.remove(id)
      habits.value = await habitsApi.list()
      marks.value = marks.value.filter((mark) => mark.habitId !== id)
    })
  }

  function addTag(data) {
    return run(async () => {
      await tagsApi.create(data)
      tags.value = await tagsApi.list()
    })
  }

  function editTag(id, patch) {
    return run(async () => {
      await tagsApi.update(id, patch)
      tags.value = await tagsApi.list()
      habits.value = await habitsApi.list()
    })
  }

  function deleteTag(id) {
    return run(async () => {
      await tagsApi.remove(id)
      tags.value = await tagsApi.list()
    })
  }

  function toggleMark(habitId, date) {
    return run(async () => {
      const result = await habitsApi.toggle(habitId, date)
      if (result.marked) marks.value = [...marks.value, result.mark]
      else marks.value = marks.value.filter((mark) => !(mark.habitId === habitId && mark.date === date))
    })
  }

  return {
    habits,
    tags,
    marks,
    loading,
    error,
    fetchHabits,
    fetchTags,
    fetchMarks,
    addHabit,
    editHabit,
    deleteHabit,
    addTag,
    editTag,
    deleteTag,
    toggleMark
  }
}
