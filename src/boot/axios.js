import { boot } from 'quasar/wrappers'
import axios from 'axios'

// 1. Detecção dinâmica do ambiente baseada na URL do navegador
const hostname = window.location.hostname
const isLocalhost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')

// 2. Define a URL padrão com base na detecção
const defaultApiUrl = isLocalhost
    ? 'http://192.168.0.20:8000/api' // Ajuste para http://localhost:8000/api se preferir
    : 'https://api.simplesgestao.digitalizesistemas.com/api/'

// 3. Cria a instância (Variável de ambiente tem prioridade, depois a lógica dinâmica)
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
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

                localStorage.removeItem('token')

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

    // Torna $axios e $api acessíveis via Options API
    app.config.globalProperties.$axios = axios
    app.config.globalProperties.$api = api
})

export { api }
