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
        <q-drawer v-model="leftDrawerOpen" bordered :width="240"
            class="bg-dark text-white"
            style="height: 100vh; overflow-y: auto;">
            <q-list padding class="q-pa-sm">
                <q-item-label header class="text-primary text-weight-bold q-mb-md">
                    Navegação
                </q-item-label>

                <!-- Dashboard -->
                <q-item clickable v-ripple to="/" exact active-class="text-primary bg-primary/10 rounded-borders">
                    <q-item-section avatar><q-icon name="space_dashboard" /></q-item-section>
                    <q-item-section>Dashboard</q-item-section>
                </q-item>

                <!-- Estoque (Expansível) -->
                <q-expansion-item icon="inventory_2" label="Estoque" to="/estoque"
                    :model-value="route.path.startsWith('/estoque')" header-class="text-weight-medium"
                    expand-icon-toggle active-class="text-primary">
                    <q-list class="q-pl-md q-py-none">
                        <q-item clickable v-ripple to="/estoque/produtos" exact
                            active-class="text-primary bg-primary/10 rounded-borders">
                            <q-item-section avatar><q-icon name="category" size="sm" /></q-item-section>
                            <q-item-section>Produtos</q-item-section>
                        </q-item>
                        <q-item clickable v-ripple to="/estoque/movimentacoes" exact
                            active-class="text-primary bg-primary/10 rounded-borders">
                            <q-item-section avatar><q-icon name="swap_horiz" size="sm" /></q-item-section>
                            <q-item-section>Movimentações</q-item-section>
                        </q-item>
                    </q-list>
                </q-expansion-item>

                <!-- Vendas (Expansível) -->
                <q-expansion-item icon="point_of_sale" label="Vendas" to="/vendas"
                    :model-value="route.path.startsWith('/vendas')" header-class="text-weight-medium" expand-icon-toggle
                    active-class="text-primary">
                    <q-list class="q-pl-md q-py-none">
                        <q-item clickable v-ripple to="/vendas/pedidos" exact
                            active-class="text-primary bg-primary/10 rounded-borders">
                            <q-item-section avatar><q-icon name="receipt_long" size="sm" /></q-item-section>
                            <q-item-section>Pedidos</q-item-section>
                        </q-item>
                        <q-item clickable v-ripple to="/vendas/contas" exact
                            active-class="text-primary bg-primary/10 rounded-borders">
                            <q-item-section avatar><q-icon name="account_balance_wallet" size="sm" /></q-item-section>
                            <q-item-section>Contas a Receber</q-item-section>
                        </q-item>
                    </q-list>
                </q-expansion-item>

                <!-- Clientes -->
                <q-item clickable v-ripple to="/clientes" exact
                    active-class="text-primary bg-primary/10 rounded-borders">
                    <q-item-section avatar><q-icon name="people" /></q-item-section>
                    <q-item-section>Clientes</q-item-section>
                </q-item>

                <q-separator class="q-my-md" color="grey-8" />

                <!-- Configurações -->
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
                    <component :is="Component" :key="route.path" />
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

// --- LÓGICA DE TRANSIÇÃO INTELIGENTE ATUALIZADA ---

// Mapeamento que agrupa subrotas aos seus módulos principais para a animação
const routeGroups = {
    '/': 0,
    '/estoque': 1, '/estoque/produtos': 1, '/estoque/movimentacoes': 1,
    '/vendas': 2, '/vendas/pedidos': 2, '/vendas/contas': 2,
    '/clientes': 3,
    '/config': 4
}

const transitionName = ref('q-transition--fade')

watch(
    () => route.path,
    (toPath, fromPath) => {
        // Se a rota não estiver no mapa, usa o índice 0 (fallback)
        const toIndex = routeGroups[toPath] !== undefined ? routeGroups[toPath] : 0
        const fromIndex = routeGroups[fromPath] !== undefined ? routeGroups[fromPath] : 0
        const isDesktop = $q.screen.gt.sm

        if (toIndex !== -1 && fromIndex !== -1) {
            if (toIndex === fromIndex) {
                // Navegando dentro do mesmo módulo (ex: Produtos -> Movimentações)
                transitionName.value = 'q-transition--fade'
            } else if (toIndex > fromIndex) {
                // Navegando para um módulo "abaixo" na hierarquia
                transitionName.value = isDesktop ? 'q-transition--slide-up' : 'q-transition--slide-left'
            } else {
                // Navegando para um módulo "acima" na hierarquia
                transitionName.value = isDesktop ? 'q-transition--slide-down' : 'q-transition--slide-right'
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

/* Ajuste fino para os ícones das subrotas ficarem alinhados */
:deep(.q-expansion-item__content .q-item__section--avatar) {
    min-width: 40px;
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