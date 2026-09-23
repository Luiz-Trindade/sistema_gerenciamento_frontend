<template>
    <q-layout view="lHh Lpr lFf">

        <!-- ================= HEADER SUPERIOR ================= -->
        <q-header v-if="route.path !== '/login'" bordered class="bg-primary text-white shadow-2">
            <q-toolbar class="q-pl-sm q-pr-sm q-gutter-sm">
                <q-btn flat dense round icon="menu" aria-label="Alternar menu" @click="toggleDrawer"
                    class="gt-sm q-mr-sm" />

                <q-toolbar-title class="text-weight-bold tracking-wide flex items-center">
                    <q-icon name="space_dashboard" class="q-mr-sm" size="24px" />
                    <span class="gt-xs">Simples Gestão</span>
                </q-toolbar-title>

                <q-space />

                <q-btn flat round :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'" @click="toggleTheme"
                    class="q-mr-sm">
                    <q-tooltip>Alternar Tema</q-tooltip>
                </q-btn>

                <q-btn flat round>
                    <q-avatar size="32px" color="white" text-color="primary">
                        <span class="text-weight-bold">{{ userIniciais }}</span>
                    </q-avatar>
                    <q-tooltip>{{ userNomeCompleto }}</q-tooltip>
                    <q-menu anchor="bottom right" self="top right" class="shadow-2">
                        <q-list style="min-width: 220px">
                            <q-item-label header class="text-grey-8">
                                <div class="text-weight-medium">{{ userNomeCompleto }}</div>
                                <div class="text-caption text-grey-7">{{ userEmail }}</div>
                            </q-item-label>
                            <q-separator />
                            <q-item clickable v-ripple v-close-popup to="/config">
                                <q-item-section avatar><q-icon name="settings" color="primary" /></q-item-section>
                                <q-item-section>Configurações</q-item-section>
                            </q-item>
                            <q-separator />
                            <q-item clickable v-ripple v-close-popup @click="abrirModalLogout" class="text-negative">
                                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                                <q-item-section>Sair do Sistema</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </q-toolbar>
        </q-header>

        <!-- ================= DRAWER LATERAL ================= -->
        <q-drawer v-if="route.path !== '/login'" v-model="leftDrawerOpen" show-if-above :width="260" :breakpoint="1024"
            bordered class="bg-dark text-white">

            <div class="fit column no-wrap">
                <div class="q-pa-md flex flex-center column">
                    <q-icon name="inventory_2" size="42px" color="primary" />
                    <div class="text-h6 text-weight-bold text-primary q-mt-xs">Simples Gestão</div>
                </div>
                <q-separator dark />

                <q-scroll-area class="col">
                    <q-list padding class="q-py-md">
                        <q-item clickable v-ripple to="/" exact
                            active-class="text-primary bg-primary/10 rounded-borders">
                            <q-item-section avatar><q-icon name="space_dashboard" /></q-item-section>
                            <q-item-section class="text-weight-medium">Dashboard</q-item-section>
                        </q-item>

                        <q-expansion-item icon="inventory_2" label="Estoque" to="/estoque"
                            :model-value="route.path.startsWith('/estoque')" expand-icon-toggle
                            active-class="text-primary bg-primary/5 rounded-borders" header-class="text-weight-medium">
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

                        <q-expansion-item icon="point_of_sale" label="Vendas" to="/vendas"
                            :model-value="route.path.startsWith('/vendas')" expand-icon-toggle
                            active-class="text-primary bg-primary/5 rounded-borders" header-class="text-weight-medium">
                            <q-list class="q-pl-md q-py-none">
                                <q-item clickable v-ripple to="/vendas/pdv" exact
                                    active-class="text-primary bg-primary/10 rounded-borders">
                                    <q-item-section avatar><q-icon name="storefront" size="sm" /></q-item-section>
                                    <q-item-section>PDV</q-item-section>
                                </q-item>
                                <q-item clickable v-ripple to="/vendas/pedidos" exact
                                    active-class="text-primary bg-primary/10 rounded-borders">
                                    <q-item-section avatar><q-icon name="receipt_long" size="sm" /></q-item-section>
                                    <q-item-section>Pedidos</q-item-section>
                                </q-item>
                                <q-item clickable v-ripple to="/vendas/contas" exact
                                    active-class="text-primary bg-primary/10 rounded-borders">
                                    <q-item-section avatar><q-icon name="account_balance_wallet"
                                            size="sm" /></q-item-section>
                                    <q-item-section>Contas a Receber</q-item-section>
                                </q-item>
                            </q-list>
                        </q-expansion-item>

                        <q-item clickable v-ripple to="/clientes" exact
                            active-class="text-primary bg-primary/10 rounded-borders">
                            <q-item-section avatar><q-icon name="people" /></q-item-section>
                            <q-item-section class="text-weight-medium">Clientes</q-item-section>
                        </q-item>
                    </q-list>
                </q-scroll-area>

                <!-- Card do usuário real -->
                <div class="q-pa-sm">
                    <q-separator dark class="q-mb-sm" />
                    <q-item clickable v-ripple to="/config" class="rounded-borders text-white">
                        <q-item-section avatar>
                            <q-avatar size="36px" color="primary" text-color="white">
                                <span class="text-weight-bold">{{ userIniciais }}</span>
                            </q-avatar>
                        </q-item-section>
                        <q-item-section>
                            <q-item-label class="text-weight-bold text-body2 ellipsis">
                                {{ userNomeCompleto }}
                            </q-item-label>
                            <q-item-label caption class="text-grey-5 ellipsis">
                                {{ userEmail }}
                            </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-icon name="chevron_right" color="grey-5" />
                        </q-item-section>
                    </q-item>
                </div>
            </div>
        </q-drawer>

        <!-- ================= CONTAINER DE PÁGINAS ================= -->
        <q-page-container :class="['page-container-wrapper', $q.dark.isActive ? 'bg-dark-9' : 'bg-grey-3']">
            <router-view v-slot="{ Component }">
                <transition :name="transitionName" mode="default">
                    <component :is="Component" :key="route.path" />
                </transition>
            </router-view>
        </q-page-container>

        <!-- ================= NAVEGAÇÃO INFERIOR (MOBILE) ================= -->
        <q-footer v-if="route.path !== '/login'" bordered class="lt-md"
            :class="$q.dark.isActive ? 'bg-dark text-grey-4' : 'bg-white text-grey-8'">
            <q-tabs dense active-color="primary" indicator-color="transparent" align="justify"
                class="text-caption q-py-xs">
                <q-route-tab name="dash" icon="space_dashboard" label="Dash" to="/" exact />
                <q-route-tab name="estoque" icon="inventory_2" label="Estoque" to="/estoque" />
                <q-route-tab name="vendas" icon="point_of_sale" label="Vendas" to="/vendas" />
                <q-route-tab name="clientes" icon="people" label="Clientes" to="/clientes" />
                <!-- <q-route-tab name="configuracoes" icon="settings" label="Config" to="/config" /> -->
            </q-tabs>
        </q-footer>

        <!-- ================= MODAL DE CONFIRMAÇÃO DE LOGOUT ================= -->
        <q-dialog v-model="confirmLogoutDialog" persistent>
            <q-card style="min-width: 350px">
                <q-card-section class="row items-center q-pb-none">
                    <q-avatar icon="logout" color="negative" text-color="white" class="q-mr-sm" />
                    <div class="text-h6">Sair do sistema</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup aria-label="Fechar" />
                </q-card-section>

                <q-card-section class="q-pt-md">
                    <div class="text-body1">Tem certeza de que deseja sair do sistema?</div>
                    <div class="text-caption text-grey-7 q-mt-sm">
                        Você precisará fazer login novamente para acessar o painel.
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pb-md q-pr-md">
                    <q-btn flat label="Cancelar" color="grey-7" v-close-popup class="q-mr-sm" />
                    <q-btn flat label="Sair" color="negative" unelevated @click="logout" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-layout>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery } from '@tanstack/vue-query'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

// --- ESTADO DO MODAL ---
const confirmLogoutDialog = ref(false)

// ==========================================
// DADOS DO USUÁRIO (mesma chave do MeUsuario → cache compartilhado)
// ==========================================
const { data: userData } = useQuery({
    queryKey: ['usuario-me'],
    queryFn: async () => {
        const response = await api.get('/usuarios/me/')
        return response.data
    },
    staleTime: 1000 * 60 * 10,
    // Não dispara a query na tela de login (usuário deslogado)
    enabled: computed(() => route.path !== '/login')
})

const userNomeCompleto = computed(() => {
    const u = userData.value
    if (!u) return 'Carregando...'
    const nome = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
    return nome || u.username || u.email || 'Usuário'
})

const userEmail = computed(() => userData.value?.email || '')

const userIniciais = computed(() => {
    const u = userData.value
    if (!u) return 'U'
    const first = (u.first_name || '').trim()
    const last = (u.last_name || '').trim()
    const letras = (first[0] || '') + (last[0] || '')
    if (letras) return letras.toUpperCase()
    // Fallback: iniciais do username ou email
    const base = u.username || u.email || ''
    return base.slice(0, 2).toUpperCase() || 'U'
})

// --- TEMA ---
const toggleTheme = () => {
    const newTheme = !$q.dark.isActive
    $q.dark.set(newTheme)
    localStorage.setItem('app-theme-preference', newTheme ? 'dark' : 'light')
}

onMounted(() => {
    const temaSalvo = localStorage.getItem('app-theme-preference')
    if (temaSalvo === 'dark') $q.dark.set(true)
    else if (temaSalvo === 'light') $q.dark.set(false)
    else $q.dark.set('auto')
})

// --- DRAWER ---
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

// --- TRANSIÇÕES ---
const routeGroups = {
    '/': 0,
    '/estoque': 1, '/estoque/produtos': 1, '/estoque/movimentacoes': 1,
    '/vendas': 2, '/vendas/pdv': 2, '/vendas/pedidos': 2, '/vendas/contas': 2,
    '/clientes': 3,
    '/config': 4,
    '/login': 5
}

const transitionName = ref('q-transition--fade')

watch(
    () => route.path,
    (toPath, fromPath) => {
        const toIndex = routeGroups[toPath] !== undefined ? routeGroups[toPath] : 0
        const fromIndex = routeGroups[fromPath] !== undefined ? routeGroups[fromPath] : 0
        const isDesktop = $q.screen.gt.sm

        if (toPath === '/login' || fromPath === '/login') {
            transitionName.value = 'q-transition--fade'
            return
        }

        if (toIndex !== -1 && fromIndex !== -1) {
            if (toIndex === fromIndex) {
                transitionName.value = 'q-transition--fade'
            } else if (toIndex > fromIndex) {
                transitionName.value = isDesktop ? 'q-transition--slide-up' : 'q-transition--slide-left'
            } else {
                transitionName.value = isDesktop ? 'q-transition--slide-down' : 'q-transition--slide-right'
            }
        } else {
            transitionName.value = 'q-transition--fade'
        }
    }
)

// --- AÇÕES ---
const abrirModalLogout = () => {
    confirmLogoutDialog.value = true
}

const logout = () => {
    confirmLogoutDialog.value = false
    localStorage.removeItem('token')
    router.push('/login')
    $q.notify({ color: 'positive', message: 'Você saiu do sistema.', icon: 'check' })
}
</script>

<style scoped>
.page-container-wrapper {
    overflow-x: hidden;
    overflow-y: hidden;
    position: relative;
}

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

.q-transition--fade-enter-active,
.q-transition--fade-leave-active {
    transition: opacity 0.2s ease;
}

.q-transition--fade-enter-from,
.q-transition--fade-leave-to {
    opacity: 0;
}

.q-transition--slide-left-enter-active,
.q-transition--slide-left-leave-active,
.q-transition--slide-right-enter-active,
.q-transition--slide-right-leave-active,
.q-transition--slide-up-enter-active,
.q-transition--slide-up-leave-active,
.q-transition--slide-down-enter-active,
.q-transition--slide-down-leave-active {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}

.q-transition--slide-left-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.q-transition--slide-left-leave-to {
    transform: translateX(-20%);
    opacity: 0;
}

.q-transition--slide-right-enter-from {
    transform: translateX(-100%);
    opacity: 0;
}

.q-transition--slide-right-leave-to {
    transform: translateX(20%);
    opacity: 0;
}

.q-transition--slide-up-enter-from {
    transform: translateY(100%);
    opacity: 0;
}

.q-transition--slide-up-leave-to {
    transform: translateY(-20%);
    opacity: 0;
}

.q-transition--slide-down-enter-from {
    transform: translateY(-100%);
    opacity: 0;
}

.q-transition--slide-down-leave-to {
    transform: translateY(20%);
    opacity: 0;
}
</style>