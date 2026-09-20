<template>
    <q-card class="no-shadow rounded-borders profile-card" bordered>
        <!-- Cabeçalho -->
        <q-card-section class="q-pb-none q-pa-md">
            <div class="row items-center no-wrap q-mb-md">
                <q-avatar size="48px" color="primary" text-color="white" icon="person" class="q-mr-sm" />
                <div class="col">
                    <div class="text-h6 text-weight-bold">Meu Perfil</div>
                    <div class="text-caption text-grey-7">Gerencie suas informações pessoais</div>
                </div>
                <!-- Botão para abrir o modal de senha -->
                <q-btn flat round color="primary" icon="lock" @click="dialogSenha = true">
                    <q-tooltip>Alterar Senha</q-tooltip>
                </q-btn>
            </div>
        </q-card-section>

        <!-- Loading Overlay -->
        <q-inner-loading :showing="isLoading" color="primary" />

        <!-- Formulário de Dados -->
        <q-card-section v-if="!isLoading && !isError" class="q-pa-md">
            <q-form @submit="saveProfile" class="q-gutter-md">
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                        <q-input v-model="form.first_name" label="Nome *" outlined dense
                            :rules="[val => !!val || 'Nome é obrigatório']" />
                    </div>
                    <div class="col-12 col-sm-6">
                        <q-input v-model="form.last_name" label="Sobrenome" outlined dense />
                    </div>
                    <div class="col-12">
                        <q-input v-model="form.email" label="E-mail" type="email" outlined dense readonly
                            hint="O e-mail é seu identificador único e não pode ser alterado por aqui." />
                    </div>
                </div>

                <q-separator class="q-my-md" />

                <div class="row justify-end q-gutter-sm">
                    <q-btn class="col-12 col-sm-auto" flat color="grey-7" label="Cancelar" @click="resetForm"
                        :disable="isSaving" />
                    <q-btn class="col-12 col-sm-auto" unelevated color="primary" label="Salvar Alterações" type="submit"
                        :loading="isSaving" />
                </div>
            </q-form>
        </q-card-section>

        <!-- Estado de Erro -->
        <q-card-section v-else-if="isError" class="text-center q-pa-xl">
            <q-icon name="error_outline" color="negative" size="48px" class="q-mb-md" />
            <div class="text-h6 text-weight-bold q-mb-sm">Erro ao carregar perfil</div>
            <div class="text-grey-7 q-mb-md">{{ error?.message || 'Não foi possível obter seus dados.' }}</div>
            <q-btn color="primary" label="Tentar Novamente" @click="refetch" />
        </q-card-section>

        <!-- ========================================== -->
        <!-- DIÁLOGO DE ALTERAÇÃO DE SENHA              -->
        <!-- ========================================== -->
        <q-dialog v-model="dialogSenha" persistent maximized>
            <q-card class="password-dialog-card">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">Alterar Senha</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-md">
                    <q-form @submit="submitChangePassword" class="q-gutter-md">
                        <q-input v-model="formSenha.current_password" label="Senha Atual *"
                            :type="showSenhaAtual ? 'text' : 'password'" outlined dense
                            :rules="[val => !!val || 'Senha atual é obrigatória']" lazy-rules>
                            <template #append>
                                <q-icon :name="showSenhaAtual ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                    @click="showSenhaAtual = !showSenhaAtual" />
                            </template>
                        </q-input>

                        <q-input v-model="formSenha.new_password" label="Nova Senha *"
                            :type="showNovaSenha ? 'text' : 'password'" outlined dense :rules="[
                                val => !!val || 'Nova senha é obrigatória',
                                val => val.length >= 6 || 'Mínimo de 6 caracteres'
                            ]" lazy-rules>
                            <template #append>
                                <q-icon :name="showNovaSenha ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                    @click="showNovaSenha = !showNovaSenha" />
                            </template>
                        </q-input>

                        <q-input v-model="formSenha.confirm_password" label="Confirmar Nova Senha *"
                            :type="showConfirmacaoSenha ? 'text' : 'password'" outlined dense :rules="[
                                val => !!val || 'Confirmação é obrigatória',
                                val => val === formSenha.new_password || 'As senhas não conferem'
                            ]" lazy-rules>
                            <template #append>
                                <q-icon :name="showConfirmacaoSenha ? 'visibility_off' : 'visibility'"
                                    class="cursor-pointer" @click="showConfirmacaoSenha = !showConfirmacaoSenha" />
                            </template>
                        </q-input>

                        <div class="row justify-end q-mt-md">
                            <q-btn flat label="Cancelar" color="grey-7" v-close-popup class="q-mr-sm" />
                            <q-btn unelevated label="Alterar Senha" color="primary" type="submit"
                                :loading="isChangingPassword" />
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const $q = useQuasar()
const queryClient = useQueryClient()

// ==========================================
// 1. DADOS DO PERFIL (GET / PATCH)
// ==========================================
const { data: userData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['usuario-me'],
    queryFn: async () => {
        const response = await api.get('/usuarios/me/')
        return response.data
    },
    staleTime: 1000 * 60 * 10
})

const form = ref({ first_name: '', last_name: '', email: '' })

watch(userData, (newData) => {
    if (newData) {
        form.value = {
            first_name: newData.first_name || '',
            last_name: newData.last_name || '',
            email: newData.email || ''
        }
    }
}, { immediate: true })

const { mutateAsync: updateProfileMutation, isPending: isSaving } = useMutation({
    mutationFn: async (payload) => {
        const response = await api.patch('/usuarios/me/', payload)
        return response.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuario-me'] })
})

const saveProfile = async () => {
    try {
        await updateProfileMutation({ first_name: form.value.first_name, last_name: form.value.last_name })
        $q.notify({ color: 'positive', message: 'Perfil atualizado com sucesso!', icon: 'check', position: 'top' })
    } catch (error) {
        const data = error.response?.data
        $q.notify({ color: 'negative', message: data?.detail || Object.values(data || {})[0]?.[0] || 'Erro ao atualizar.', icon: 'error', position: 'top', timeout: 5000 })
    }
}

const resetForm = () => {
    if (userData.value) {
        form.value = { first_name: userData.value.first_name || '', last_name: userData.value.last_name || '', email: userData.value.email || '' }
        $q.notify({ color: 'info', message: 'Alterações descartadas.', icon: 'info', position: 'top' })
    }
}

// ==========================================
// 2. ALTERAÇÃO DE SENHA (POST)
// ==========================================
const dialogSenha = ref(false)
const formSenha = ref({ current_password: '', new_password: '', confirm_password: '' })
const showSenhaAtual = ref(false)
const showNovaSenha = ref(false)
const showConfirmacaoSenha = ref(false)

const { mutateAsync: changePasswordMutation, isPending: isChangingPassword } = useMutation({
    mutationFn: async (payload) => {
        const response = await api.post('/usuarios/change-password/', payload)
        return response.data
    },
    onSuccess: () => {
        dialogSenha.value = false
        formSenha.value = { current_password: '', new_password: '', confirm_password: '' }
        $q.notify({ color: 'positive', message: 'Senha alterada com sucesso!', icon: 'check', position: 'top' })
    }
})

const submitChangePassword = async () => {
    try {
        await changePasswordMutation({
            current_password: formSenha.value.current_password,
            new_password: formSenha.value.new_password
        })
    } catch (error) {
        const data = error.response?.data
        $q.notify({
            color: 'negative',
            message: data?.detail || 'Erro ao alterar senha. Verifique se a senha atual está correta.',
            icon: 'error',
            position: 'top',
            timeout: 5000
        })
    }
}
</script>

<style scoped>
.profile-card {
    width: 100%;
    padding: 12px;
    margin: 0 auto;
}

.q-inner-loading {
    border-radius: inherit;
}

.password-dialog-card {
    width: min(100%, 500px);
    max-width: 100%;
    margin: auto;
}

@media (max-width: 599px) {
    .password-dialog-card {
        width: 100%;
        min-height: 100%;
        border-radius: 0;
    }
}
</style>