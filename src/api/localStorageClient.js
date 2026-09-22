// Simulated backend client. Every "resource" is a collection persisted to
// localStorage and accessed through async methods that mimic a REST API
// (including network latency and the possibility of failure), so calling
// code never needs to know it isn't talking to a real server.

const DEFAULT_LATENCY_MS = 250

function delay(ms = DEFAULT_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readCollection(key) {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : []
}

function writeCollection(key, items) {
  localStorage.setItem(key, JSON.stringify(items))
}

function generateId() {
  return crypto.randomUUID()
}

// Creates a fake REST resource backed by a localStorage key, e.g.
// createResource('tasks') -> { list, get, create, update, remove }
export function createResource(key, { latency = DEFAULT_LATENCY_MS } = {}) {
  return {
    async list() {
      await delay(latency)
      return readCollection(key)
    },

    async get(id) {
      await delay(latency)
      const item = readCollection(key).find((i) => i.id === id)
      if (!item) throw new Error(`${key}/${id} not found`)
      return item
    },

    async create(data) {
      await delay(latency)
      const items = readCollection(key)
      const item = { id: generateId(), createdAt: new Date().toISOString(), ...data }
      items.push(item)
      writeCollection(key, items)
      return item
    },

    async update(id, patch) {
      await delay(latency)
      const items = readCollection(key)
      const index = items.findIndex((i) => i.id === id)
      if (index === -1) throw new Error(`${key}/${id} not found`)
      items[index] = { ...items[index], ...patch, updatedAt: new Date().toISOString() }
      writeCollection(key, items)
      return items[index]
    },

    async remove(id) {
      await delay(latency)
      const items = readCollection(key)
      const next = items.filter((i) => i.id !== id)
      writeCollection(key, next)
      return true
    }
  }
}
