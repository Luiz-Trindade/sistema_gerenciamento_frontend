// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app'

export default defineConfig((/* ctx */) => {
    return {
        // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
        // preFetch: true,

        // app boot file (/src/boot)
        // --> boot files are part of "main.js"
        // https://v2.quasar.dev/quasar-cli-vite/boot-files
        boot: ['axios', 'vue-query'],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
        css: ['app.scss'],

        // https://github.com/quasarframework/quasar/tree/dev/extras
        extras: [
            'roboto-font', // optional, you are not bound to it
            'material-icons', // optional, you are not bound to it
        ],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
        build: {
            target: {
                // browser: 'baseline-widely-available',
                // node: 'node22'
            },

            // https://v2.quasar.dev/quasar-cli-vite/page-routing-with-vue-router#filename-based-routing
            filenameBasedRouting: true,

            vueRouterMode: 'hash', // available values: 'hash', 'history'

            vitePlugins: [
                [
                    'vite-plugin-checker',
                    {
                        eslint: {
                            lintCommand:
                                'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
                            useFlatConfig: true,
                        },
                    },
                    { server: false },
                ],
            ],
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
        devServer: {
            open: true, // opens browser window automatically
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
        framework: {
            config: {
                addressbarColor: '#1976d2',
            },

            // Quasar plugins
            plugins: ['Dark', 'Dialog', 'Notify', 'Loading', 'AddressbarColor'],
        },

        // animations: 'all', // --- includes all animations
        // https://v2.quasar.dev/options/animations
        animations: [],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#sourcefiles
        sourceFiles: {
            // rootComponent: 'src/App.vue',
            // router: 'src/router/index',
            // store: 'src/store/index',
            // pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
            // pwaServiceWorker: 'src-pwa/custom-service-worker',
            // pwaManifestFile: 'src-pwa/manifest.json',
            // electronMain: 'src-electron/electron-main',
            // electronPreload: 'src-electron/electron-preload',
            // bexManifestFile: 'src-bex/manifest.json',
        },

        // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
        ssr: {
            prodPort: 3000,
            middlewares: ['render'],
        },

        // https://v2.quasar.dev/quasar-cli-vite/developing-ssg/configuring-ssg
        ssg: {},

        // ============================================
        // PWA
        // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
        // ============================================
        pwa: {
            workboxMode: 'GenerateSW',
            injectPWAMetaTags: true,
            extendPWAManifestJson(json) {
                json.name = 'Simples Gestão'
                json.short_name = 'Simples'
                json.description = 'Sistema de gestão de estoque e vendas'
                json.display = 'standalone'
                json.orientation = 'any'
                json.background_color = '#ffffff'
                json.theme_color = '#1976d2'
                json.lang = 'pt-BR'
                json.dir = 'ltr'
                return json
            },
        },

        // https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
        cordova: {},

        // https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
        capacitor: {
            hideSplashscreen: true,
        },

        // https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
        electron: {
            preloadScripts: ['electron-preload'],
            inspectPort: 5858,
            bundler: 'packager',
            packager: {},
            builder: {
                appId: 'simples-gestao',
            },
        },

        // https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
        bex: {
            extraScripts: [],
        },
    }
})
