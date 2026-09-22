<script setup>
import { onMounted, ref } from 'vue'
import AvatarCrop from '@/components/AvatarCrop.vue'
import { useProfile } from '@/composables/useCharacter'
import { notify } from '@/composables/useToast'

const { profile, loading, error, fetchProfile, saveProfile } = useProfile()
const name = ref('')
const file = ref(null)
const cropSrc = ref('')

onMounted(async () => {
  await fetchProfile()
  name.value = profile.value?.name || ''
})

function onFile(event) {
  const picked = event.target.files?.[0]
  event.target.value = ''
  if (!picked) return
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = URL.createObjectURL(picked)
}

function closeCrop() {
  if (cropSrc.value) URL.revokeObjectURL(cropSrc.value)
  cropSrc.value = ''
}

async function onCropped(avatar) {
  closeCrop()
  try {
    await saveProfile({ avatar })
    notify('Ícone atualizado')
  } catch (err) {
    notify(err.message || 'Não foi possível salvar', 'bad')
  }
}

async function onSave() {
  try {
    await saveProfile({ name: name.value })
    notify('Nome salvo')
  } catch (err) {
    notify(err.message || 'Não foi possível salvar', 'bad')
  }
}

async function clearAvatar() {
  try {
    await saveProfile({ avatar: null })
    notify('Ícone removido')
  } catch (err) {
    notify(err.message || 'Não foi possível remover', 'bad')
  }
}
</script>

<template>
  <section class="page pixel-panel profile">
    <div class="identity">
      <img
        v-if="profile?.avatar"
        class="avatar lg"
        :src="profile.avatar"
        alt="Ícone do perfil"
      >
      <span
        v-else
        class="avatar lg placeholder"
      >?</span>
      <input
        ref="file"
        class="hidden"
        type="file"
        accept="image/*"
        @change="onFile"
      >
      <UButton @click="file?.click()">
        Carregar ícone
      </UButton>
      <UButton
        v-if="profile?.avatar"
        class="danger"
        @click="clearAvatar"
      >
        Remover
      </UButton>
    </div>
    <div class="profile-body">
      <p class="kicker">
        Perfil
      </p>
      <form
        class="name-row"
        @submit.prevent="onSave"
      >
        <UInput
          v-model="name"
          placeholder="Nome"
          maxlength="24"
        />
        <UButton type="submit">
          Salvar
        </UButton>
      </form>
      <p
        v-if="error"
        class="error"
      >
        {{ error.message }}
      </p>
      <p
        v-if="loading"
        class="hint"
      >
        Carregando…
      </p>
      <dl
        v-if="profile"
        class="stats"
      >
        <div>
          <dt>Nível da conta</dt>
          <dd>{{ profile.level }} · {{ profile.title }}</dd>
        </div>
        <div>
          <dt>XP total</dt>
          <dd>{{ profile.xp }}</dd>
        </div>
        <div>
          <dt>Sequência</dt>
          <dd>{{ profile.streak }}d</dd>
        </div>
        <div>
          <dt>Hábitos</dt>
          <dd>{{ profile.habitCount }}</dd>
        </div>
        <div>
          <dt>Marcas</dt>
          <dd>{{ profile.markCount }}</dd>
        </div>
      </dl>
      <p class="hint">
        O XP total soma todas as marcas. O nível dos heróis fica no Hall e na ficha.
      </p>
    </div>
    <AvatarCrop
      v-if="cropSrc"
      :src="cropSrc"
      @cancel="closeCrop"
      @confirm="onCropped"
    />
  </section>
</template>

<style scoped>
.profile {
  align-items: center;
  text-align: center;
}

.identity,
.profile-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: min(100%, 560px);
}

.hidden {
  display: none;
}

.name-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  width: 100%;
  margin: 12px 0;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  width: 100%;
  margin: 0 0 12px;
}

.stats div {
  padding: 10px;
  text-align: center;
  background: #1b2130;
  border: 3px solid #0c0f16;
}

.stats dt {
  color: var(--muted);
  font-size: 14px;
}

.stats dd {
  margin: 4px 0 0;
  font-size: 18px;
}
</style>
