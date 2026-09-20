<template>
    <q-page class="login-page flex flex-center column">

        <!-- Cartão de Login -->
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

        <!-- Seção de Créditos / Participantes -->
        <div class="creators-section text-center q-mt-md q-px-md">
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs">👥 Desenvolvido por:</div>
            <div class="text-caption text-grey-8 participants-list">
                <span class="participant">Caio Pantoja Correa — 202302416071</span>
                <span class="participant">Jessica Freire Carvalho — 202404170527</span>
                <span class="participant">Lohhana Lima Pinheiro — 202508864207</span>
                <span class="participant">Luiz Gabriel Magalhães Trindade — 202302954812</span>
                <span class="participant">Paulo Henrique Magno Moura — 202302416081</span>
            </div>
            <div class="text-caption text-grey-6 q-mt-sm">
                © {{ new Date().getFullYear() }} Sistema de Gerenciamento
            </div>
        </div>

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
    min-height: 100dvh;
    padding: 24px 16px;
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
    isolation: isolate;
}

.login-page::before {
    content: '';
    position: absolute;
    inset: -12px;
    z-index: -1;
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
        url('/images/background_login.webp') center / cover no-repeat;
    filter: blur(4px);
}

.login-page>* {
    position: relative;
}

.login-card {
    width: 100%;
    max-width: 420px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
}

/* Estilos da Seção de Criadores */
.creators-section {
    width: 100%;
    max-width: 420px;
    /* Alinhado com a largura do cartão */
}

.participants-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    /* Espaçamento suave entre os nomes */
}

.participant {
    display: block;
    transition: color 0.2s ease;
}

.participant:hover {
    color: var(--q-primary) !important;
}

@media (max-width: 480px) {
    .login-page {
        justify-content: flex-start;
        padding: 16px 12px 20px;
    }

    .login-card,
    .creators-section {
        max-width: 100%;
    }

    .login-card {
        border-radius: 10px;
    }

    .text-h5 {
        font-size: 1.25rem;
    }

    .participants-list {
        gap: 6px;
        line-height: 1.35;
    }
}

@media (max-height: 700px) and (min-width: 481px) {
    .login-page {
        justify-content: flex-start;
        padding-top: 16px;
        padding-bottom: 16px;
    }
}
</style>