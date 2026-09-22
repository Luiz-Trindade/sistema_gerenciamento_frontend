<template>
    <q-page class="q-pa-sm q-pa-md-sm">

        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Configurações" icon="settings" />
        </q-breadcrumbs>

        <div class="text-h6 text-weight-bold q-mb-md flex items-center">
            <q-icon name="settings" class="q-mr-sm" color="primary" size="28px" />
            Configurações
        </div>

        <!-- ============================================ -->
        <!-- APARÊNCIA                                    -->
        <!-- ============================================ -->
        <q-card class="no-shadow rounded-borders q-mb-md" bordered>
            <q-card-section class="q-py-sm q-px-md">
                <div class="text-overline text-grey-7">Aparência</div>
            </q-card-section>
            <q-separator />
            <q-list>
                <q-item tag="label" v-ripple>
                    <q-item-section avatar>
                        <q-icon :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'" color="primary" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Tema Escuro</q-item-label>
                        <q-item-label class="text-caption text-grey-7">
                            Alternar entre modo claro e escuro
                        </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle :model-value="$q.dark.isActive" @update:model-value="alternarTema" color="primary" />
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card>

        <!-- ============================================ -->
        <!-- PERFIL (componente MeUsuario)                -->
        <!-- ============================================ -->
        <MeUsuario class="q-mb-md" />

        <!-- ============================================ -->
        <!-- SEGURANÇA                                    -->
        <!-- ============================================ -->
        <q-card class="no-shadow rounded-borders q-mb-md" bordered>
            <q-card-section class="q-py-sm q-px-md">
                <div class="text-overline text-grey-7">Segurança</div>
            </q-card-section>
            <q-separator />
            <q-card-section class="q-pa-md">
                <div class="row items-center q-col-gutter-md">
                    <div class="col-12 col-sm">
                        <div class="row items-center no-wrap">
                            <q-avatar icon="lock" color="primary" text-color="white" size="40px" class="q-mr-md" />
                            <div class="col">
                                <div class="text-subtitle1 text-weight-medium">Senha de acesso</div>
                                <div class="text-caption text-grey-7">
                                    Recomendamos alterar sua senha periodicamente.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-sm-auto">
                        <q-btn unelevated color="primary" icon="lock_reset" label="Alterar senha"
                            :class="$q.screen.lt.sm ? 'full-width' : ''" @click="abrirDialogSenha" />
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- ============================================ -->
        <!-- SOBRE                                        -->
        <!-- ============================================ -->
        <Sobre sistema-nome="Simples Gestão" versao="1.0.0" :desenvolvedores="listaDesenvolvedores" class="q-mb-md" />

        <!-- ============================================ -->
        <!-- SESSÃO                                       -->
        <!-- ============================================ -->
        <q-card class="no-shadow rounded-borders" bordered>
            <q-card-section class="q-py-sm q-px-md">
                <div class="text-overline text-grey-7">Sessão</div>
            </q-card-section>
            <q-separator />
            <q-card-section class="text-center q-pa-md">
                <q-btn outline color="negative" label="Sair do sistema" icon="logout" class="full-width"
                    @click="confirmarSaida" />
            </q-card-section>
        </q-card>

        <!-- ============================================ -->
        <!-- DIÁLOGO: ALTERAR SENHA                       -->
        <!-- ============================================ -->
        <q-dialog v-model="dialogSenha" persistent :maximized="$q.screen.lt.sm" @before-show="resetFormSenha">
            <q-card class="column no-wrap" :style="$q.screen.lt.sm ? '' : 'width: 480px; max-width: 90vw;'">
                <q-card-section class="row items-center q-pb-none">
                    <q-avatar icon="lock" color="primary" text-color="white" size="36px" class="q-mr-sm" />
                    <div class="text-h6">Alterar Senha</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="col scroll q-pt-md">
                    <q-form @submit="submitChangePassword" class="q-gutter-md">
                        <!-- Senha atual -->
                        <q-input v-model="formSenha.current_password" label="Senha atual *"
                            :type="showSenhaAtual ? 'text' : 'password'" outlined dense
                            :rules="[val => !!val || 'Senha atual é obrigatória']" lazy-rules
                            :disable="isChangingPassword">
                            <template #prepend>
                                <q-icon name="lock_outline" />
                            </template>
                            <template #append>
                                <q-icon :name="showSenhaAtual ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                    @click="showSenhaAtual = !showSenhaAtual">
                                    <q-tooltip>{{ showSenhaAtual ? 'Ocultar' : 'Mostrar' }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>

                        <q-separator />

                        <!-- Nova senha -->
                        <q-input v-model="formSenha.new_password" label="Nova senha *"
                            :type="showNovaSenha ? 'text' : 'password'" outlined dense :rules="[
                                val => !!val || 'Nova senha é obrigatória',
                                val => val.length >= 8 || 'Mínimo de 8 caracteres'
                            ]" lazy-rules :disable="isChangingPassword">
                            <template #prepend>
                                <q-icon name="key" />
                            </template>
                            <template #append>
                                <q-icon :name="showNovaSenha ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                    @click="showNovaSenha = !showNovaSenha">
                                    <q-tooltip>{{ showNovaSenha ? 'Ocultar' : 'Mostrar' }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>

                        <!-- Barra de força -->
                        <div v-if="formSenha.new_password">
                            <div class="row items-center q-mb-xs">
                                <div class="col text-caption text-grey-7">Força da senha</div>
                                <div class="col-auto text-caption text-weight-medium" :class="`text-${forcaSenha.cor}`">
                                    {{ forcaSenha.label }}
                                </div>
                            </div>
                            <q-linear-progress :value="forcaSenha.score / 100" size="8px" rounded
                                :color="forcaSenha.cor" track-color="grey-3" />

                            <div class="row q-col-gutter-sm q-mt-sm">
                                <div class="col-6" v-for="req in forcaSenha.requisitos" :key="req.label">
                                    <div class="row items-center text-caption"
                                        :class="req.ok ? 'text-positive' : 'text-grey-6'">
                                        <q-icon :name="req.ok ? 'check_circle' : 'radio_button_unchecked'" size="14px"
                                            class="q-mr-xs" />
                                        {{ req.label }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Confirmar senha -->
                        <q-input v-model="formSenha.confirm_password" label="Confirmar nova senha *"
                            :type="showConfirmacaoSenha ? 'text' : 'password'" outlined dense :rules="[
                                val => !!val || 'Confirmação é obrigatória',
                                val => val === formSenha.new_password || 'As senhas não conferem'
                            ]" lazy-rules :disable="isChangingPassword">
                            <template #prepend>
                                <q-icon name="check_circle_outline" />
                            </template>
                            <template #append>
                                <q-icon :name="showConfirmacaoSenha ? 'visibility_off' : 'visibility'"
                                    class="cursor-pointer" @click="showConfirmacaoSenha = !showConfirmacaoSenha">
                                    <q-tooltip>{{ showConfirmacaoSenha ? 'Ocultar' : 'Mostrar' }}</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>

                        <div class="row justify-end q-col-gutter-sm q-mt-md">
                            <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                                <q-btn label="Cancelar" color="grey-7" flat v-close-popup
                                    :class="$q.screen.lt.sm ? 'full-width' : 'q-mr-sm'" :disable="isChangingPassword" />
                            </div>
                            <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                                <q-btn label="Alterar senha" color="primary" type="submit" icon="check"
                                    :loading="isChangingPassword" :class="$q.screen.lt.sm ? 'full-width' : ''" />
                            </div>
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { api } from '@/boot/axios'
import { useMutation } from '@tanstack/vue-query'
import Sobre from '@/components/Sobre.vue'
import MeUsuario from '@/components/MeUsuario.vue'

const $q = useQuasar()
const router = useRouter()

// ==========================================
// APARÊNCIA
// ==========================================
const alternarTema = (valor) => {
    $q.dark.set(valor)
    localStorage.setItem('app-theme-preference', valor ? 'dark' : 'light')
    $q.notify({
        message: valor ? 'Tema escuro ativado' : 'Tema claro ativado',
        color: 'primary',
        icon: valor ? 'dark_mode' : 'light_mode',
        position: 'top'
    })
}

onMounted(() => {
    const temaSalvo = localStorage.getItem('app-theme-preference')
    if (temaSalvo) $q.dark.set(temaSalvo === 'dark')
})

// ==========================================
// SOBRE
// ==========================================
const listaDesenvolvedores = ref([
    { nome: 'Caio Pantoja Correa', matricula: '202302416071' },
    { nome: 'Jessica Freire Carvalho', matricula: '202404170527' },
    { nome: 'Lohhana Lima Pinheiro', matricula: '202508864207' },
    { nome: 'Luiz Gabriel Magalhães Trindade', matricula: '202302954812' },
    { nome: 'Paulo Henrique Magno Moura', matricula: '202302416081' }
])

// ==========================================
// SESSÃO
// ==========================================
const confirmarSaida = () => {
    $q.dialog({
        title: 'Sair do Sistema',
        message: 'Deseja realmente encerrar a sua sessão?',
        persistent: true,
        ok: { label: 'Sair', color: 'negative' },
        cancel: { label: 'Cancelar', color: 'grey-7' }
    }).onOk(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        router.push('/login')
        $q.notify({
            message: 'Sessão encerrada com sucesso',
            color: 'info',
            icon: 'check',
            position: 'top'
        })
    })
}

// ==========================================
// SEGURANÇA — Alterar senha
// ==========================================
const dialogSenha = ref(false)
const formSenha = ref({ current_password: '', new_password: '', confirm_password: '' })
const showSenhaAtual = ref(false)
const showNovaSenha = ref(false)
const showConfirmacaoSenha = ref(false)

const abrirDialogSenha = () => {
    resetFormSenha()
    dialogSenha.value = true
}

const resetFormSenha = () => {
    formSenha.value = { current_password: '', new_password: '', confirm_password: '' }
    showSenhaAtual.value = false
    showNovaSenha.value = false
    showConfirmacaoSenha.value = false
}

// --- Força da senha ---
const forcaSenha = computed(() => {
    const senha = formSenha.value.new_password || ''
    const requisitos = [
        { label: '8+ caracteres', ok: senha.length >= 8 },
        { label: 'Letra maiúscula', ok: /[A-Z]/.test(senha) },
        { label: 'Letra minúscula', ok: /[a-z]/.test(senha) },
        { label: 'Número', ok: /\d/.test(senha) },
        { label: 'Símbolo', ok: /[^A-Za-z0-9]/.test(senha) },
        { label: 'Sem espaços', ok: senha.length > 0 && !/\s/.test(senha) }
    ]
    const okCount = requisitos.filter(r => r.ok).length

    let label = 'Muito fraca'
    let cor = 'negative'
    if (okCount >= 6) { label = 'Forte'; cor = 'positive' }
    else if (okCount >= 4) { label = 'Média'; cor = 'orange' }
    else if (okCount >= 2) { label = 'Fraca'; cor = 'deep-orange' }

    return {
        score: Math.round((okCount / requisitos.length) * 100),
        label,
        cor,
        requisitos
    }
})

const { mutateAsync: changePasswordMutation, isPending: isChangingPassword } = useMutation({
    mutationFn: async (payload) => {
        const response = await api.post('/usuarios/change-password/', payload)
        return response.data
    },
    onSuccess: () => {
        dialogSenha.value = false
        resetFormSenha()
        $q.notify({
            color: 'positive',
            message: 'Senha alterada com sucesso!',
            icon: 'check_circle',
            position: 'top'
        })
    }
})

const submitChangePassword = async () => {
    try {
        await changePasswordMutation({
            current_password: formSenha.value.current_password,
            new_password: formSenha.value.new_password
        })
    } catch (err) {
        $q.notify({
            color: 'negative',
            message: extrairErro(err, 'Erro ao alterar senha. Verifique a senha atual.'),
            icon: 'error',
            position: 'top',
            timeout: 5000
        })
    }
}

// ==========================================
// HELPER
// ==========================================
const extrairErro = (err, fallback) => {
    const data = err.response?.data
    if (!data) return fallback
    if (typeof data === 'string') return data
    if (data.detail) return data.detail
    if (data.non_field_errors?.[0]) return data.non_field_errors[0]
    const primeiro = Object.values(data)[0]
    if (Array.isArray(primeiro) && primeiro[0]) return primeiro[0]
    return fallback
}
</script>

<style scoped>
.q-item {
    cursor: pointer;
}
</style>