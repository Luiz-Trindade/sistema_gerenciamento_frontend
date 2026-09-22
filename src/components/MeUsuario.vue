<template>
    <q-card class="no-shadow rounded-borders" bordered>
        <!-- Cabeçalho -->
        <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap q-col-gutter-md">
                <div class="col-auto">
                    <q-avatar size="56px" color="primary" text-color="white">
                        <span class="text-h6">{{ iniciais }}</span>
                    </q-avatar>
                </div>
                <div class="col">
                    <div class="text-h6 text-weight-bold">Meu Perfil</div>
                    <div class="text-caption text-grey-7">
                        Gerencie suas informações pessoais
                    </div>
                </div>
            </div>
        </q-card-section>

        <!-- Banner de alterações não salvas (fora do header, com respiro) -->
        <q-card-section v-if="isDirty && !isLoading && !isError" class="q-pt-none q-pb-md q-px-md">
            <q-banner dense rounded class="bg-orange-1 text-orange-9">
                <template #avatar>
                    <q-icon name="info" color="orange-9" />
                </template>
                Você tem alterações não salvas.
                <template #action>
                    <q-btn flat dense color="orange-9" label="Descartar" @click="resetForm" />
                </template>
            </q-banner>
        </q-card-section>

        <q-separator />

        <q-inner-loading :showing="isLoading" color="primary" label="Carregando perfil..." />

        <!-- Formulário -->
        <q-card-section v-if="!isLoading && !isError" class="q-pa-md">
            <q-form @submit="saveProfile" class="q-gutter-md">
                <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-6">
                        <q-input v-model="form.first_name" label="Nome *" outlined dense
                            :rules="[val => !!val || 'Nome é obrigatório']" lazy-rules :disable="isSaving">
                            <template #prepend>
                                <q-icon name="badge" />
                            </template>
                        </q-input>
                    </div>
                    <div class="col-12 col-sm-6">
                        <q-input v-model="form.last_name" label="Sobrenome" outlined dense :disable="isSaving">
                            <template #prepend>
                                <q-icon name="badge" />
                            </template>
                        </q-input>
                    </div>

                    <div class="col-12">
                        <q-input v-model="form.email" label="E-mail" type="email" outlined dense readonly
                            hint="O e-mail é seu identificador único e não pode ser alterado por aqui.">
                            <template #prepend>
                                <q-icon name="mail" />
                            </template>
                            <template #append>
                                <q-icon name="lock" color="grey-6">
                                    <q-tooltip>Campo bloqueado</q-tooltip>
                                </q-icon>
                            </template>
                        </q-input>
                    </div>
                </div>


                <!-- Ações (usando sistema de grid, não q-gutter) -->
                <div class="row justify-end q-col-gutter-sm q-mt-md">
                    <div class="col-12 col-sm-auto">
                        <q-btn class="full-width" flat color="grey-7" label="Cancelar" no-caps @click="resetForm"
                            :disable="isSaving || !isDirty" />
                    </div>
                    <div class="col-12 col-sm-auto">
                        <q-btn class="full-width" unelevated color="primary" label="Salvar alterações" type="submit"
                            icon="save" no-caps :loading="isSaving" :disable="!isDirty" />
                    </div>
                </div>
            </q-form>
        </q-card-section>

        <!-- Estado de Erro -->
        <q-card-section v-else-if="isError" class="text-center q-pa-xl">
            <q-icon name="error_outline" color="negative" size="48px" class="q-mb-md" />
            <div class="text-h6 text-weight-bold q-mb-sm">Erro ao carregar perfil</div>
            <div class="text-grey-7 q-mb-md">
                {{ error?.message || 'Não foi possível obter seus dados.' }}
            </div>
            <q-btn color="primary" label="Tentar novamente" icon="refresh" no-caps @click="refetch" />
        </q-card-section>
    </q-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const $q = useQuasar()
const queryClient = useQueryClient()

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

const iniciais = computed(() => {
    const nome = form.value.first_name?.trim() || ''
    const sobrenome = form.value.last_name?.trim() || ''
    const letras = (nome[0] || '') + (sobrenome[0] || '')
    return letras.toUpperCase() || 'U'
})

const isDirty = computed(() => {
    if (!userData.value) return false
    return (
        (form.value.first_name || '') !== (userData.value.first_name || '') ||
        (form.value.last_name || '') !== (userData.value.last_name || '')
    )
})

const { mutateAsync: updateProfileMutation, isPending: isSaving } = useMutation({
    mutationFn: async (payload) => {
        const response = await api.patch('/usuarios/me/', payload)
        return response.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuario-me'] })
})

const saveProfile = async () => {
    try {
        await updateProfileMutation({
            first_name: form.value.first_name,
            last_name: form.value.last_name
        })
        $q.notify({
            color: 'positive',
            message: 'Perfil atualizado com sucesso!',
            icon: 'check_circle',
            position: 'top'
        })
    } catch (err) {
        $q.notify({
            color: 'negative',
            message: extrairErro(err, 'Erro ao atualizar perfil.'),
            icon: 'error',
            position: 'top',
            timeout: 5000
        })
    }
}

const resetForm = () => {
    if (!userData.value) return
    form.value = {
        first_name: userData.value.first_name || '',
        last_name: userData.value.last_name || '',
        email: userData.value.email || ''
    }
}

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