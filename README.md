# vibe-coding-template

Vite + Vue 3 + Tailwind CSS v4 + Nuxt UI (standalone, non-Nuxt) starter.

## Stack

- **Build tool:** Vite
- **UI framework:** Vue 3 (`<script setup>`)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Component library:** Nuxt UI v4 (via `@nuxt/ui/vite` + `@nuxt/ui/vue-plugin`, used standalone without the Nuxt framework)
- **Routing:** vue-router

## Getting started

```sh
npm install
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # eslint
npm run test     # vitest
```

## Project rules

### 1. No real backend — simulate every API in localStorage

This project has no backend server. **Any feature that would normally call
a backend (CRUD operations, persistence, "saving" data, etc.) must be
implemented as a simulated API that reads and writes to the browser's
`localStorage`.**

The pattern to follow:

- `src/api/localStorageClient.js` — generic fake-REST client. `createResource(key)`
  returns an object with `list`, `get`, `create`, `update`, `remove` methods.
  Each method is `async` and adds artificial latency, so calling code behaves
  exactly as if it were hitting a real HTTP API (this makes it trivial to
  swap in a real backend later without touching components).
- `src/api/resources/*.js` — one file per "resource"/entity, each just calling
  `createResource('vibe:<name>')` with a namespaced localStorage key.
- `src/composables/use*.js` — composables that consume a resource's API and
  expose reactive state (`loading`, `error`, data) to components.

See `src/api/resources/tasks.js`, `src/composables/useTasks.js`, and
`src/views/HomeView.vue` for a full working example (a simple task list).

**Do not** call `localStorage` directly from components or composables —
always go through a resource created with `createResource` from
`src/api/localStorageClient.js`, so all simulated persistence stays
consistent and swappable.

### 2. UI components

Prefer Nuxt UI components (`UButton`, `UInput`, `UCheckbox`, `UApp`, etc.)
over hand-rolled markup/CSS. Use Tailwind utility classes for layout and
spacing.
