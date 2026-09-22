<script setup>
import ToastStack from '@/components/ToastStack.vue'

const links = [
  { to: '/', label: 'Início' },
  { to: '/taberna', label: 'Taberna' },
  { to: '/hall', label: 'Hall' },
  { to: '/personagem', label: 'Ficha' },
  { to: '/perfil', label: 'Perfil' }
]
</script>

<template>
  <UApp>
    <div class="app-shell">
      <header class="app-nav">
        <p class="brand">
          HABITOS
        </p>
        <nav>
          <RouterLink
            v-for="link in links"
            :key="link.to"
            v-slot="{ href, navigate, isExactActive }"
            :to="link.to"
            custom
          >
            <a
              :href="href"
              class="nav-link"
              :class="{ 'is-active': isExactActive }"
              @click="navigate"
            >
              {{ link.label }}
            </a>
          </RouterLink>
        </nav>
      </header>
      <RouterView />
      <ToastStack />
    </div>
  </UApp>
</template>
