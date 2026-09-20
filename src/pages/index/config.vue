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

        <!-- Card de Preferências do Usuário -->
        <q-card class="no-shadow rounded-borders q-mb-md" bordered>
            <q-list separator>
                <!-- Dark Mode -->
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
            </q-list>
        </q-card>

        <!-- Componente Sobre (Reutilizável com Props) -->
        <!-- Ajuste o caminho './Sobre.vue' se o arquivo estiver em uma pasta 'components' -->
        <Sobre sistema-nome="Simples Gestão" versao="1.0.0" :desenvolvedores="listaDesenvolvedores" class="q-mb-md" />

        <!-- Card de Ação de Sessão -->
        <q-card class="no-shadow rounded-borders" bordered>
            <q-card-section class="text-center q-pa-md">
                <q-btn outline color="negative" label="Sair do Sistema" icon="logout" class="full-width"
                    @click="confirmarSaida" />
            </q-card-section>
        </q-card>

    </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

// Importando o componente Sobre
import Sobre from '@/components/Sobre.vue'

const $q = useQuasar()
const router = useRouter()

// Dados centralizados para passar via props
const listaDesenvolvedores = ref([
    { nome: 'Caio Pantoja Correa', matricula: '202302416071' },
    { nome: 'Jessica Freire Carvalho', matricula: '202404170527' },
    { nome: 'Lohhana Lima Pinheiro', matricula: '202508864207' },
    { nome: 'Luiz Gabriel Magalhães Trindade', matricula: '202302954812' },
    { nome: 'Paulo Henrique Magno Moura', matricula: '202302416081' }
])

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
</script>

<style scoped>
.q-item {
    cursor: pointer;
}
</style>