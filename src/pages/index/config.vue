<template>
    <q-page class="q-ma-md">

        <!-- Breadcrumbs (Navegação estrutural) -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Configurações" icon="settings" />
        </q-breadcrumbs>

        <div class="text-h6 text-weight-bold q-mb-md">
            <q-icon name="settings" class="q-mr-sm" color="primary" size="28px" />
            Configurações
        </div>

        <q-card class="no-shadow rounded-borders q-mb-md" bordered>
            <q-list separator>
                <q-item tag="label" v-ripple>
                    <q-item-section avatar>
                        <q-icon :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'" color="primary" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Tema Escuro</q-item-label>
                        <q-item-label class="text-caption text-grey-7">Alternar entre modo claro e escuro</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle :model-value="$q.dark.isActive" @update:model-value="alternarTema" color="primary" />
                    </q-item-section>
                </q-item>

                <q-item tag="label" v-ripple>
                    <q-item-section avatar>
                        <q-icon name="notifications" color="primary" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">Notificações</q-item-label>
                        <q-item-label class="text-caption text-grey-7">Receber alertas de vencimentos e novos
                            pedidos</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle v-model="notificacoesAtivas" color="primary" />
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card>

        <q-card class="no-shadow rounded-borders" bordered>
            <q-card-section class="text-center q-pa-md">
                <div class="text-caption text-grey-7 q-mb-sm">
                    Sistema de Gerenciamento v1.0.0
                </div>
                <q-btn outline color="negative" label="Sair do Sistema" icon="logout" class="full-width q-mt-sm"
                    @click="confirmarSaida" />
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()
const notificacoesAtivas = ref(true)

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
    if (temaSalvo) {
        $q.dark.set(temaSalvo === 'dark')
    }
})

const confirmarSaida = () => {
    $q.dialog({
        title: 'Sair do Sistema',
        message: 'Deseja realmente encerrar a sua sessão?',
        persistent: true,
        ok: { label: 'Sair', color: 'negative' },
        cancel: { label: 'Cancelar', color: 'grey-7' }
    }).onOk(() => {
        // 1. Elimina os tokens armazenados
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')

        // 2. Redireciona o utilizador para a página de login
        router.push('/login')

        // 3. Notificação visual
        $q.notify({
            message: 'Sessão encerrada com sucesso',
            color: 'info',
            icon: 'check',
            position: 'top'
        })
    })
}
</script>

<style scoped>
.q-item {
    cursor: pointer;
}
</style>