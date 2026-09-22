import { createResource } from '@/api/localStorageClient'

// Example simulated resource. All "backend" traffic for tasks lives in
// localStorage under this key — see src/api/localStorageClient.js.
export const tasksApi = createResource('vibe:tasks')
