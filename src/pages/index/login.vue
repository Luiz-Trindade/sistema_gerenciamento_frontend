<template>
    <q-page class="login-page">
        <div class="login-wrapper">
            <!-- ===== Painel esquerdo: identidade visual ===== -->
            <div class="login-side">
                <!-- Header: logo + marca -->
                <div class="login-side__content">
                    <img src="/favicon.png" alt="Simples Gestão" class="login-side__logo" />
                    <div class="login-side__brand">Simples Gestão</div>
                </div>

                <!-- Meio: tagline + features -->
                <div class="login-side__body">
                    <div class="text-h5 text-weight-medium text-white login-side__headline">
                        Gestão simples,<br />resultados reais
                    </div>
                    <div class="text-body2 text-grey-4 q-mt-sm login-side__subheadline">
                        Tudo o que sua empresa precisa em um só lugar.
                    </div>

                    <div class="login-side__features q-mt-xl">
                        <div class="login-side__feature">
                            <div class="login-side__feature-icon">
                                <q-icon name="inventory_2" size="20px" />
                            </div>
                            <div>
                                <div class="text-body2 text-weight-medium text-white">
                                    Controle de estoque
                                </div>
                                <div class="text-caption text-grey-5">
                                    Acompanhe produtos e movimentações em tempo real
                                </div>
                            </div>
                        </div>

                        <div class="login-side__feature">
                            <div class="login-side__feature-icon">
                                <q-icon name="point_of_sale" size="20px" />
                            </div>
                            <div>
                                <div class="text-body2 text-weight-medium text-white">
                                    Vendas e PDV
                                </div>
                                <div class="text-caption text-grey-5">
                                    Registre pedidos e gerencie contas a receber
                                </div>
                            </div>
                        </div>

                        <div class="login-side__feature">
                            <div class="login-side__feature-icon">
                                <q-icon name="insights" size="20px" />
                            </div>
                            <div>
                                <div class="text-body2 text-weight-medium text-white">
                                    Relatórios gerenciais
                                </div>
                                <div class="text-caption text-grey-5">
                                    Decisões baseadas em dados do seu negócio
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="login-side__footer text-caption text-grey-5">
                    © {{ new Date().getFullYear() }} Simples Gestão · Todos os direitos reservados
                </div>
            </div>

            <!-- ===== Painel direito: formulário ===== -->
            <div class="login-form-side">
                <div class="login-form-box">
                    <!-- Cabeçalho -->
                    <div class="login-form__header q-mb-lg">
                        <div class="login-form__badge">
                            <q-icon name="lock" size="14px" />
                            <span>Acesso seguro</span>
                        </div>
                        <div class="text-h5 text-weight-bold text-primary q-mt-md">
                            Bem-vindo de volta
                        </div>
                        <div class="text-body2 text-grey-7 q-mt-xs">
                            Informe suas credenciais para acessar sua conta
                        </div>
                    </div>

                    <!-- Formulário -->
                    <q-form @submit="fazerLogin" class="q-gutter-md">
                        <q-input v-model="email" label="E-mail" type="email" outlined dense autocomplete="email" :rules="[
                            val => !!val || 'E-mail é obrigatório',
                            val => /.+@.+\..+/.test(val) || 'Digite um e-mail válido'
                        ]">
                            <template v-slot:prepend>
                                <q-icon name="mail" color="primary" />
                            </template>
                        </q-input>

                        <q-input v-model="senha" label="Senha" :type="mostrarSenha ? 'text' : 'password'" outlined dense
                            autocomplete="current-password" :rules="[
                                val => !!val || 'Senha é obrigatória',
                                val => val.length >= 6 || 'Mínimo de 6 caracteres'
                            ]">
                            <template v-slot:prepend>
                                <q-icon name="lock" color="primary" />
                            </template>
                            <template v-slot:append>
                                <q-icon :name="mostrarSenha ? 'visibility_off' : 'visibility'" color="grey-6"
                                    class="cursor-pointer" @click="mostrarSenha = !mostrarSenha">
                                    <q-tooltip>
                                        {{ mostrarSenha ? 'Ocultar senha' : 'Mostrar senha' }}
                                    </q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>

                        <q-checkbox v-model="lembrarMe" label="Lembrar-me" dense color="primary" class="text-caption" />

                        <q-btn icon="login" type="submit" color="primary" class="full-width q-mt-md" size="md"
                            unelevated rounded :loading="loading" label="Entrar">
                            <template v-slot:loading>
                                <q-spinner-dots color="white" size="20px" />
                            </template>
                        </q-btn>
                    </q-form>

                    <!-- Rodapé do formulário -->
                    <div class="login-form__footer q-mt-xl text-center">
                        <q-separator class="q-mb-md" />
                        <div class="text-caption text-grey-6">
                            Não tem uma conta?
                            <a href="#" class="text-primary text-weight-medium login-form__link">
                                Fale com o suporte
                            </a>
                        </div>
                    </div>
                </div>
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
const lembrarMe = ref(false)
const loading = ref(false)

const fazerLogin = async () => {
    loading.value = true
    try {
        const response = await api.post('/token/', {
            email: email.value,
            password: senha.value
        })

        const token = response.data.access || response.data.token

        if (token) {
            localStorage.setItem('token', token)
            if (response.data.refresh) {
                localStorage.setItem('refreshToken', response.data.refresh)
            }
            if (lembrarMe.value) {
                localStorage.setItem('lembrar-me', 'true')
            }

            $q.notify({
                message: 'Login realizado com sucesso!',
                color: 'positive',
                icon: 'check',
                position: 'top'
            })

            const redirectPath = route.query.redirect || '/'
            router.push(redirectPath)
        }
    } catch (error) {
        const errorMsg =
            error.response?.data?.detail ||
            'E-mail ou senha inválidos. Tente novamente.'

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
/* ==========================================
   Página e wrapper
   ========================================== */
.login-page {
    min-height: 100dvh;
    background: #f5f6f8;
}

.body--dark .login-page {
    background: #121212;
}

.login-wrapper {
    display: flex;
    width: 100%;
    min-height: 100dvh;
}

/* ==========================================
   Painel esquerdo — identidade visual
   ========================================== */
.login-side {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    color: #fff;
    position: relative;
    overflow: hidden;
    background:
        linear-gradient(160deg,
            rgba(10, 20, 40, 0.92) 0%,
            rgba(10, 20, 40, 0.78) 100%),
        url('/images/background_login.webp') center / cover no-repeat;
}

/* Brilho decorativo */
.login-side::after {
    content: '';
    position: absolute;
    bottom: -120px;
    right: -120px;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: var(--q-primary);
    opacity: 0.18;
    filter: blur(60px);
    pointer-events: none;
}

.login-side__content {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 1;
}

.login-side__logo {
    width: 44px;
    height: 44px;
    object-fit: contain;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 6px;
    backdrop-filter: blur(8px);
}

.login-side__brand {
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: 0.3px;
}

.login-side__body {
    position: relative;
    z-index: 1;
    max-width: 460px;
}

.login-side__headline {
    line-height: 1.2;
    letter-spacing: -0.3px;
}

.login-side__subheadline {
    max-width: 380px;
}

/* Features */
.login-side__features {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.login-side__feature {
    display: flex;
    align-items: flex-start;
    gap: 14px;
}

.login-side__feature-icon {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--q-primary);
    backdrop-filter: blur(8px);
}

.login-side__footer {
    position: relative;
    z-index: 1;
}

/* ==========================================
   Painel direito — formulário
   ========================================== */
.login-form-side {
    flex: 1;
    max-width: 520px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    background: #ffffff;
}

.body--dark .login-form-side {
    background: #1e1e1e;
}

.login-form-box {
    width: 100%;
    max-width: 400px;
}

/* Badge de segurança */
.login-form__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(25, 118, 210, 0.1);
    color: var(--q-primary);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.body--dark .login-form__badge {
    background: rgba(25, 118, 210, 0.18);
}

/* Link do rodapé */
.login-form__link {
    text-decoration: none;
    transition: opacity 0.2s ease;
}

.login-form__link:hover {
    opacity: 0.75;
    text-decoration: underline;
}

/* Foco dos inputs na cor primária */
.login-form-box :deep(.q-field--outlined.q-field--focused .q-field__control:after) {
    border-color: var(--q-primary);
}

/* ==========================================
   Responsividade — breakpoints oficiais do Quasar
   (xs < 600 · sm 600–1023.99 · md 1024–1439.99)
   ========================================== */

/* De telas médias para baixo: painel vira topo compacto, sem esconder */
@media (max-width: 1023.99px) {
    .login-wrapper {
        flex-direction: column;
        min-height: auto;
    }

    .login-side {
        flex: none;
        padding: 32px 28px;
        min-height: 220px;
    }

    /* Features some no formato compacto — texto sobra em telas estreitas */
    .login-side__features {
        display: none;
    }

    .login-side__footer {
        display: none;
    }

    .login-form-side {
        max-width: none;
        width: 100%;
        padding: 32px 24px;
    }
}

/* Celulares */
@media (max-width: 599.99px) {
    .login-side {
        padding: 24px 20px;
        min-height: 180px;
    }

    .login-side__headline {
        font-size: 1.3rem;
    }

    .login-side__subheadline {
        display: none;
    }

    .login-form-side {
        padding: 28px 20px;
    }

    .login-form-box {
        max-width: 100%;
    }

    .login-form-box .text-h5 {
        font-size: 1.2rem;
    }
}

/* Telas muito baixas em paisagem: prioriza o formulário */
@media (max-height: 600px) and (max-width: 1023.99px) {
    .login-side {
        min-height: 0;
        padding: 20px 24px;
    }

    .login-side__body {
        display: none;
    }
}
</style>