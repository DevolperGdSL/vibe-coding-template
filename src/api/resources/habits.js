async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Falha na API')
  return data
}

export const habitsApi = {
  list: () => request('/api/habits'),
  create: (data) => request('/api/habits', { method: 'POST', body: data }),
  update: (id, patch) => request(`/api/habits/${id}`, { method: 'PATCH', body: patch }),
  remove: (id) => request(`/api/habits/${id}`, { method: 'DELETE' }),
  marks: (from, to) => request(`/api/marks?from=${from}&to=${to}`),
  toggle: (habitId, date) => request('/api/marks', { method: 'POST', body: { habitId, date } })
}

export const tagsApi = {
  list: () => request('/api/tags'),
  create: (data) => request('/api/tags', { method: 'POST', body: data }),
  update: (id, patch) => request(`/api/tags/${id}`, { method: 'PATCH', body: patch }),
  remove: (id) => request(`/api/tags/${id}`, { method: 'DELETE' })
}

export const profileApi = {
  get: () => request('/api/profile'),
  update: (patch) => request('/api/profile', { method: 'PATCH', body: patch })
}

export const heroesApi = {
  list: () => request('/api/heroes'),
  create: (data) => request('/api/heroes', { method: 'POST', body: data }),
  rename: (id, name) => request(`/api/heroes/${id}`, { method: 'PATCH', body: { name } }),
  activate: (id) => request(`/api/heroes/${id}/activate`, { method: 'POST', body: {} }),
  spend: (id, attr, delta) => request(`/api/heroes/${id}/stats`, { method: 'POST', body: { attr, delta } }),
  remove: (id) => request(`/api/heroes/${id}`, { method: 'DELETE' })
}

export const fontApi = {
  get: () => request('/api/font')
}
