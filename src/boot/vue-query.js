// src/boot/vue-query.js
import { boot } from 'quasar/wrappers'
import { VueQueryPlugin } from '@tanstack/vue-query'

export default boot(({ app }) => {
    app.use(VueQueryPlugin, {
        queryClientConfig: {
            defaultOptions: {
                queries: {
                    // Tempo em ms que os dados são considerados "frescos".
                    // 5 minutos = evita requisições desnecessárias se o usuário navegar e voltar.
                    staleTime: 1000 * 60 * 5,
                    // Atualiza os dados automaticamente a cada 5 minutos.
                    refetchInterval: 1000 * 60 * 5,
                    // Tempo em ms que os dados ficam no cache antes de serem limpos da memória.
                    gcTime: 1000 * 60 * 10,
                    retry: 1, // Tenta 1 vez em caso de falha de rede antes de dar erro
                    refetchOnWindowFocus: false, // Opcional: desative se achar invasivo recarregar ao voltar a aba
                },
            },
        },
    })
})
