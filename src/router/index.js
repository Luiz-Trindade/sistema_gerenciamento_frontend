import { defineRouter } from '#q-app'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import {
    createMemoryHistory,
    createRouter,
    createWebHashHistory,
    createWebHistory,
} from 'vue-router'

export default defineRouter((/* { store, ssrContext } */) => {
    const createHistory = import.meta.env.QUASAR_SERVER
        ? createMemoryHistory
        : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
          ? createWebHistory
          : createWebHashHistory

    const Router = createRouter({
        scrollBehavior: () => ({ left: 0, top: 0 }),
        routes,
        history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
    })

    // --- GUARDA GLOBAL DE NAVEGAÇÃO (SÍNCRONA E RÁPIDA) ---
    Router.beforeEach((to) => {
        const isAuthenticated = !!localStorage.getItem('token')
        const publicPages = ['/login', '/register', '/forgot-password']
        const isPublic = publicPages.includes(to.path)

        if (!isPublic) {
            console.log(`[Router] Acessando rota privada: ${to.path}`)
        }

        // 1. Sem token tentou acessar rota privada -> Manda pro /login
        if (!isPublic && !isAuthenticated) {
            console.log('[Router] Sem token. Redirecionando para /login')
            return { path: '/login' }
        }

        // 2. Com token tentou acessar o /login -> Manda pra home '/'
        if (to.path === '/login' && isAuthenticated) {
            return { path: '/' }
        }
    })

    if (import.meta.hot) {
        handleHotUpdate(Router)
    }

    return Router
})
