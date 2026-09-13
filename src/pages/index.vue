<template>
    <q-layout view="hHh LpR fFf">

        <!-- Header Superior -->
        <q-header bordered class="bg-primary text-white">
            <q-toolbar>
                <q-btn flat dense round icon="menu" aria-label="Alternar menu lateral" @click="toggleDrawer"
                    class="gt-sm q-mr-sm" />

                <q-toolbar-title class="text-weight-bold text-h6">
                    Sistema de Gerenciamento
                </q-toolbar-title>

                <q-btn flat round icon="account_circle" aria-label="Perfil" to="/config" />
            </q-toolbar>
        </q-header>

        <!-- Drawer Lateral: Fixo, com scroll interno independente -->
        <q-drawer v-model="leftDrawerOpen" bordered :width="225" style="height: 100vh; overflow-y: auto;"
            class="bg-dark text-white">
            <q-list padding class="q-pa-sm">
                <q-item-label header class="text-primary text-weight-bold q-mb-md">
                    Navegação
                </q-item-label>

                <q-item clickable v-ripple to="/" exact active-class="text-primary bg-primary/10 rounded-borders">
                    <q-item-section avatar><q-icon name="space_dashboard" /></q-item-section>
                    <q-item-section>Dashboard</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/estoque" exact
                    active-class="text-primary bg-primary/10 rounded-borders">
                    <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
                    <q-item-section>Estoque</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/vendas" exact active-class="text-primary bg-primary/10 rounded-borders">
                    <q-item-section avatar><q-icon name="point_of_sale" /></q-item-section>
                    <q-item-section>Vendas</q-item-section>
                </q-item>

                <q-item clickable v-ripple to="/clientes" exact
                    active-class="text-primary bg-primary/10 rounded-borders">
                    <q-item-section avatar><q-icon name="people" /></q-item-section>
                    <q-item-section>Clientes</q-item-section>
                </q-item>

                <q-separator class="q-my-md bg-grey-8" />

                <q-item clickable v-ripple to="/config" exact active-class="text-primary bg-primary/10 rounded-borders">
                    <q-item-section avatar><q-icon name="settings" /></q-item-section>
                    <q-item-section>Configurações</q-item-section>
                </q-item>
            </q-list>
        </q-drawer>

        <!-- Container das Páginas com Transição Inteligente -->
        <q-page-container class="page-container-wrapper">
            <router-view v-slot="{ Component }">
                <transition :name="transitionName" mode="default">
                    <component :is="Component" />
                </transition>
            </router-view>
        </q-page-container>

        <!-- Navegação Inferior: Visível APENAS no Mobile/Tablet -->
        <q-footer bordered class="lt-md" :class="$q.dark.isActive ? 'bg-dark text-grey-4' : 'bg-white text-grey-8'">
            <q-tabs dense active-color="primary" indicator-color="transparent" align="justify"
                class="text-caption q-py-xs">
                <q-route-tab name="dash" icon="space_dashboard" label="Dash" to="/" exact />
                <q-route-tab name="estoque" icon="inventory_2" label="Estoque" to="/estoque" exact />
                <q-route-tab name="vendas" icon="point_of_sale" label="Vendas" to="/vendas" exact />
                <q-route-tab name="clientes" icon="people" label="Clientes" to="/clientes" exact />
                <q-route-tab name="configuracoes" icon="settings" label="Config" to="/config" exact />
            </q-tabs>
        </q-footer>

    </q-layout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const route = useRoute()

// Estado do Drawer
const leftDrawerOpen = ref($q.screen.gt.sm)

watch(
    () => $q.screen.gt.sm,
    (isDesktop) => {
        leftDrawerOpen.value = isDesktop
    }
)

const toggleDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value
}

// --- LÓGICA DE TRANSIÇÃO INTELIGENTE ---

const routeOrder = ['/', '/estoque', '/vendas', '/clientes', '/config']

const transitionName = ref('q-transition--fade')

watch(
    () => route.path,
    (toPath, fromPath) => {
        const toIndex = routeOrder.indexOf(toPath)
        const fromIndex = routeOrder.indexOf(fromPath)
        const isDesktop = $q.screen.gt.sm

        if (toIndex !== -1 && fromIndex !== -1) {
            if (isDesktop) {
                // Desktop: slide vertical
                transitionName.value = toIndex > fromIndex
                    ? 'q-transition--slide-up'
                    : 'q-transition--slide-down'
            } else {
                // Mobile: slide horizontal
                transitionName.value = toIndex > fromIndex
                    ? 'q-transition--slide-left'
                    : 'q-transition--slide-right'
            }
        } else {
            transitionName.value = 'q-transition--fade'
        }
    }
)
</script>

<style scoped>
/* Evita o surgimento de barra de rolagem no slide e fixa o contêiner */
.page-container-wrapper {
    overflow-x: hidden;
    overflow-y: hidden;
    position: relative;
}

:deep(.q-tab--active) {
    color: var(--q-primary) !important;
    font-weight: 600;
}

:deep(.q-tab--active .q-tab__icon) {
    transform: scale(1.1);
    transition: transform 0.2s ease;
}
</style>