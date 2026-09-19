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

                    <q-btn icon="login" type="submit" color="primary" class="full-width q-mt-sm" size="lg" unelevated
                        :loading="loading" label="Entrar" />
                </q-form>
            </q-card-section>
        </q-card>

    </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const loading = ref(false)

const fazerLogin = async () => {
    loading.value = true
    try {
        // Chamada à API na rota /api/token
        const response = await api.post('/token/', {
            email: email.value,
            password: senha.value
        })

        // Captura o token (suporta o formato SimpleJWT 'data.access' ou genérico 'data.token')
        const token = response.data.access || response.data.token

        if (token) {
            localStorage.setItem('token', token)

            // Salva o Refresh Token se a API retornar
            if (response.data.refresh) {
                localStorage.setItem('refreshToken', response.data.refresh)
            }

            $q.notify({
                message: 'Login realizado com sucesso!',
                color: 'positive',
                icon: 'check',
                position: 'top'
            })

            // Redireciona para a página que o usuário tentava acessar ou para a home '/'
            const redirectPath = route.query.redirect || '/'
            router.push(redirectPath)
        }
    } catch (error) {
        // Exibe mensagem vinda da API (ex: Django "No active account found") ou genérica
        const errorMsg = error.response?.data?.detail || 'E-mail ou senha inválidos. Tente novamente.'

        $q.notify({
            message: errorMsg,
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