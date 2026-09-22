import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import ui from '@nuxt/ui/vite'
import { apiMiddleware } from './server/api.js'

function sqliteApi() {
  return {
    name: 'sqlite-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware)
    }
  }
}

export default defineConfig({
  plugins: [sqliteApi(), vue(), tailwindcss(), ui()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
