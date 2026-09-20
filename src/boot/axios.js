import { boot } from 'quasar/wrappers'
import axios from 'axios'

// Instância personalizada do Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://192.168.0.20:8000/api',
})

export default boot(({ app, router }) => {
    // -------------------------------------------------------------
    // 1. INTERCEPTOR DE REQUISIÇÃO (Injeta o Token em cada chamada)
    // -------------------------------------------------------------
    api.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token')

            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }

            return config
        },
        (error) => {
            return Promise.reject(error)
        },
    )

    // -------------------------------------------------------------
    // 2. INTERCEPTOR DE RESPOSTA (Trata Token Expirado/Inválido)
    // -------------------------------------------------------------
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            // Se a API retornar 401 (Não Autorizado)
            if (error.response?.status === 401) {
                console.warn(
                    '[Axios Interceptor] Sessão expirada ou token inválido. Redirecionando...',
                )

                // Remove o token inválido
                localStorage.removeItem('token')

                // Redireciona para o login apenas se já não estiver na página de login
                if (router.currentRoute.value.path !== '/login') {
                    router.push({
                        path: '/login',
                        query: { redirect: router.currentRoute.value.fullPath },
                    })
                }
            }

            return Promise.reject(error)
        },
    )

    // Torna $axios e$api acessíveis via Options API (this.$api / this.$axios)
    app.config.globalProperties.$axios = axios
    app.config.globalProperties.$api = api
})

// Exporta a instância para ser usada em arquivos JS/TS, Composables e Stores
export { api }
