<template>
    <q-page class="login-page flex flex-center">

        <q-card class="login-card" bordered flat>
            <q-card-section class="text-center q-pb-none q-pt-lg">
                <q-icon name="inventory_2" color="primary" size="64px" class="q-mb-sm" />
                <div class="text-h5 text-weight-bold">Sistema de Gerenciamento</div>
                <div class="text-caption text-grey-7 q-mt-xs">Acesse sua conta para continuar</div>
            </q-card-section>

            <q-card-section class="q-pt-lg q-px-lg">
                <q-form @submit="fazerLogin" class="q-gutter-md">

                    <q-input v-model="email" label="E-mail" type="email" outlined dense autocomplete="email" :rules="[
                        val => !!val || 'E-mail é obrigatório',
                        val => /.+@.+\..+/.test(val) || 'Digite um e-mail válido'
                    ]">
                        <template v-slot:prepend>
                            <q-icon name="mail" />
                        </template>
                    </q-input>

                    <q-input v-model="senha" label="Senha" :type="mostrarSenha ? 'text' : 'password'" outlined dense
                        autocomplete="current-password" :rules="[
                            val => !!val || 'Senha é obrigatória',
                            val => val.length >= 6 || 'Mínimo de 6 caracteres'
                        ]">
                        <template v-slot:prepend>
                            <q-icon name="lock" />
                        </template>
                        <template v-slot:append>
                            <q-icon :name="mostrarSenha ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                @click="mostrarSenha = !mostrarSenha" />
                        </template>
                    </q-input>

                    <q-btn type="submit" color="primary" class="full-width q-mt-sm" size="lg" unelevated
                        :loading="loading" label="Entrar" />
                </q-form>
            </q-card-section>
        </q-card>

    </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
// import api from 'src/boot/axios'

const router = useRouter()
const $q = useQuasar()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const loading = ref(false)

const fazerLogin = async () => {
    loading.value = true
    try {
        // MOCK: Substitua pela chamada real à sua API Django
        // const response = await api.post('/api/auth/login/', {
        //   email: email.value,
        //   password: senha.value
        // })

        await new Promise(resolve => setTimeout(resolve, 1000)) // Simula delay de rede
        const tokenMock = 'mock-jwt-token-xyz123'

        localStorage.setItem('token', tokenMock)

        $q.notify({
            message: 'Login realizado com sucesso!',
            color: 'positive',
            icon: 'check',
            position: 'top'
        })

        router.push('/')
    } catch {
        $q.notify({
            message: 'E-mail ou senha inválidos. Tente novamente.',
            color: 'negative',
            icon: 'error',
            position: 'top'
        })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-page {
    min-height: 100vh;
    padding: 16px;
}

.login-card {
    width: 100%;
    max-width: 420px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
}
</style>