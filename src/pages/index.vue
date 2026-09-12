<template>
    <q-layout view="hHh lpR fFf">
        <!-- Header Superior -->
        <q-header elevated class="bg-primary text-white">
            <q-toolbar>
                <q-toolbar-title class="text-weight-bold text-h6">
                    Sistema de Gerenciamento
                </q-toolbar-title>

                <!-- Melhoria: Link direto para as configurações -->
                <q-btn flat round icon="account_circle" aria-label="Perfil" to="/config" />
            </q-toolbar>
        </q-header>

        <!-- Container das Páginas -->
        <q-page-container>
            <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                    <component :is="Component" />
                </transition>
            </router-view>
        </q-page-container>

        <!-- Navegação Inferior (Estilo Mobile Compacto) -->
        <!-- CORREÇÃO: Fundo adaptativo ao modo escuro -->
        <q-footer elevated :class="$q.dark.isActive ? 'bg-dark text-grey-4' : 'bg-white text-grey-8'">
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
// O q-route-tab gerencia automaticamente baseado na rota atual
</script>

<style scoped>
/* Transição suave estilo app nativo ao trocar de aba */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Destaque visual adicional para tabs ativas */
:deep(.q-tab--active) {
    color: var(--q-primary) !important;
    font-weight: 600;
}

:deep(.q-tab--active .q-tab__icon) {
    transform: scale(1.1);
    transition: transform 0.2s ease;
}
</style>