<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

onMounted(() => {
  // 1. Verifica se há uma preferência salva no localStorage
  const temaSalvo = localStorage.getItem('app-theme-preference')

  if (temaSalvo) {
    // 2. Aplica o tema salvo imediatamente (true para dark, false para light)
    $q.dark.set(temaSalvo === 'dark')
  } else {
    // Opcional: Se o usuário nunca escolheu, pode seguir o tema do sistema operacional
    // $q.dark.set('auto')
  }
})
</script>