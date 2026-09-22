import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TavernView from '@/views/TavernView.vue'
import HallView from '@/views/HallView.vue'
import CharacterView from '@/views/CharacterView.vue'
import ProfileView from '@/views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/taberna', name: 'tavern', component: TavernView },
    { path: '/hall', name: 'hall', component: HallView },
    { path: '/personagem', name: 'character', component: CharacterView },
    { path: '/perfil', name: 'profile', component: ProfileView }
  ]
})

export default router
