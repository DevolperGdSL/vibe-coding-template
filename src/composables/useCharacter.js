import { ref } from 'vue'
import { heroesApi, profileApi } from '@/api/resources/habits'

export function useProfile() {
  const profile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchProfile() {
    loading.value = true
    error.value = null
    try {
      profile.value = await profileApi.get()
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function saveProfile(patch) {
    error.value = null
    try {
      profile.value = await profileApi.update(patch)
    } catch (err) {
      error.value = err
      throw err
    }
  }

  return { profile, loading, error, fetchProfile, saveProfile }
}

export function useHeroes() {
  const heroes = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchHeroes() {
    loading.value = true
    error.value = null
    try {
      heroes.value = await heroesApi.list()
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function run(fn) {
    error.value = null
    try {
      await fn()
      heroes.value = await heroesApi.list()
      return true
    } catch (err) {
      error.value = err
      return false
    }
  }

  return {
    heroes,
    loading,
    error,
    fetchHeroes,
    recruit: (data) => run(() => heroesApi.create(data)),
    activate: (id) => run(() => heroesApi.activate(id)),
    spend: (id, attr, delta) => run(() => heroesApi.spend(id, attr, delta)),
    removeHero: (id) => run(() => heroesApi.remove(id))
  }
}
