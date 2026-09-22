import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import router from './router'
import { fontApi } from './api/resources/habits'
import './assets/main.css'

async function loadLocalFont() {
  try {
    const { url } = await fontApi.get()
    if (!url) return
    const face = new FontFace('HabitPixel', `url(${url})`)
    await face.load()
    document.fonts.add(face)
    document.documentElement.classList.add('has-pixel-font')
  } catch {
    return
  }
}

loadLocalFont()

const app = createApp(App)
app.use(router)
app.use(ui)
app.mount('#app')
