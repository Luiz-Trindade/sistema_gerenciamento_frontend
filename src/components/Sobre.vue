<template>
    <q-card class="no-shadow rounded-borders" bordered>
        <q-card-section class="q-pa-lg">
            <!-- Cabeçalho -->
            <div class="text-h5 text-weight-bold q-mb-md flex items-center">
                <q-icon name="info" color="primary" size="md" class="q-mr-sm" />
                Sobre o Sistema
            </div>

            <!-- Nome e Versão -->
            <div class="q-mb-xl" aria-live="polite">
                <div class="text-h6 text-weight-bold text-primary">{{ sistemaNome }}</div>
                <div class="text-subtitle2 text-grey-7">Versão {{ versao }}</div>
            </div>

            <!-- Seção: Sobre -->
            <div class="q-mb-xl">
                <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm flex items-center">
                    <q-icon name="description" size="sm" class="q-mr-sm" />
                    Sobre
                </div>
                <p class="text-body2 text-grey-8 q-my-none" style="line-height: 1.6;">
                    O <strong>{{ sistemaNome }}</strong> é uma solução moderna, simples e intuitiva,
                    desenvolvida para organizar informações, otimizar fluxos de trabalho e apoiar
                    a tomada de decisões na gestão de atividades e recursos.
                </p>
            </div>

            <!-- Seção: Para que serve -->
            <div class="q-mb-xl">
                <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm flex items-center">
                    <q-icon name="lightbulb" size="sm" class="q-mr-sm" />
                    Para que serve?
                </div>
                <p class="text-body2 text-grey-8 q-my-none" style="line-height: 1.6;">
                    Centraliza dados operacionais, facilita o acompanhamento de processos em tempo real
                    e torna o gerenciamento diário mais rápido, seguro e acessível para toda a equipe.
                </p>
            </div>

            <q-separator class="q-my-xl" />

            <!-- Seção: Equipe -->
            <div class="text-subtitle1 text-weight-bold text-primary q-mb-md flex items-center">
                <q-icon name="groups" size="sm" class="q-mr-sm" />
                Equipe de Desenvolvimento
            </div>

            <!-- Listagem com espaçamento refinado -->
            <q-list class="q-mb-xl">
                <q-item v-for="dev in desenvolvedores" :key="dev.matricula" class="q-px-none q-py-md">
                    <q-item-section avatar>
                        <q-avatar icon="person" color="primary" text-color="white" size="md" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-bold text-body1">{{ dev.nome }}</q-item-label>
                        <q-item-label caption class="text-grey-7">Matrícula: {{ dev.matricula }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>

            <q-separator class="q-my-xl" />

            <!-- Seção: Licença e Copyright -->
            <div class="rounded-borders q-pa-md text-center">
                <div class="row items-center justify-center q-mb-sm text-body2 text-weight-medium text-grey-8">
                    <q-icon name="verified" color="positive" class="q-mr-xs" />
                    Software Livre sob a licença
                    <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" class="text-primary q-ml-xs"
                        style="text-decoration: none;">
                        AGPL-3.0
                    </a>
                </div>
                <div class="text-caption text-grey-6">
                    © {{ anoAtual }} {{ sistemaNome }} · Todos os direitos reservados aos autores e contribuidores.
                </div>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
    sistemaNome: {
        type: String,
        default: 'Sistema de Gerenciamento'
    },
    versao: {
        type: String,
        default: '1.0.0'
    },
    desenvolvedores: {
        type: Array,
        default: () => [],
        validator: (valor) => valor.every(
            (dev) => dev && typeof dev.nome === 'string' && typeof dev.matricula === 'string'
        )
    }
})

const anoAtual = computed(() => new Date().getFullYear())
</script>