<template>
    <q-page :style-fn="pageStyleFn" class="q-pa-none q-pa-sm-md flex flex-center overflow-hidden">
        <q-card flat :bordered="$q.screen.gt.xs" class="column no-wrap overflow-hidden full-width chat-card"
            :style="cardStyle">
            <!-- Cabeçalho do Chat -->
            <q-card-section class="col-auto row items-center justify-between q-py-xs q-px-sm q-px-md-md">
                <div class="row items-center q-gutter-xs no-wrap ellipsis">
                    <q-icon name="auto_awesome" color="amber-8" :size="$q.screen.xs ? '18px' : '20px'" />
                    <span class="text-subtitle2 text-weight-medium ellipsis">
                        Assistente de Relatórios IA
                    </span>
                    <q-badge color="deep-purple-6" text-color="white" class="q-ml-xs text-weight-bold"
                        style="font-size: 10px;">
                        ERP + KDD
                    </q-badge>
                </div>

                <div class="row items-center q-gutter-xs no-wrap">
                    <!-- Botão de Resumo Metodológico KDD -->
                    <q-btn flat dense size="sm" color="deep-purple-6" icon="hub"
                        :label="$q.screen.xs ? 'KDD' : 'Pipeline KDD'" no-caps @click="kddInfoDialog = true">
                        <q-tooltip>Ver arquitetura KDD e bases Big Data integradas</q-tooltip>
                    </q-btn>

                    <!-- Exportar Relatório -->
                    <q-btn v-if="messages.length > 1" flat dense size="sm" color="primary" icon="download"
                        :label="$q.screen.xs ? '' : 'Exportar'" no-caps :disable="isTyping" @click="exportChatMarkdown">
                        <q-tooltip>Baixar conversa em Markdown (.md)</q-tooltip>
                    </q-btn>

                    <!-- Limpar Conversa -->
                    <q-btn v-if="messages.length > 1" flat dense size="sm" color="grey-6" icon="delete_sweep"
                        :label="$q.screen.xs ? '' : 'Limpar'" no-caps :disable="isTyping" @click="clearChat">
                        <q-tooltip v-if="$q.screen.xs">Limpar conversa</q-tooltip>
                    </q-btn>
                </div>
            </q-card-section>

            <q-separator />

            <!-- Área de Mensagens -->
            <q-card-section ref="messagesContainer" class="col scroll q-pa-xs q-pa-sm-md messages-area">
                <div v-for="(msg, index) in messages" :key="index" class="q-mb-sm q-mb-sm-md message-row"
                    :class="msg.sent ? 'q-pl-lg q-pl-sm-xl' : 'q-pr-none q-pr-sm-md'">
                    <q-chat-message :name="msg.sent ? 'Você' : 'Assistente IA'" :stamp="msg.stamp" :sent="msg.sent"
                        :bg-color="msg.sent ? 'primary' : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
                        :text-color="msg.sent ? 'white' : ($q.dark.isActive ? 'grey-1' : 'grey-10')"
                        class="responsive-chat-message">
                        <template v-if="$q.screen.gt.xs" #avatar>
                            <q-avatar size="30px" class="q-mx-xs">
                                <q-icon v-if="!msg.sent" name="auto_awesome" color="amber-8" size="20px" />
                                <q-icon v-else name="person" color="primary" size="20px" />
                            </q-avatar>
                        </template>

                        <!-- Mensagem do Usuário -->
                        <div v-if="msg.sent" class="text-body2 user-message">
                            <q-badge v-if="msg.category === 'kdd'" color="amber-9" text-color="white"
                                class="q-mr-xs vertical-middle" style="font-size: 9px;">
                                KDD
                            </q-badge>
                            <span>{{ msg.text }}</span>
                        </div>

                        <!-- Resposta da IA -->
                        <div v-else class="ai-message-wrapper">
                            <div class="rich-content" v-html="renderFormattedContent(msg.text)"></div>

                            <!-- Card do Gráfico (vue-chartjs) -->
                            <q-card v-if="msg.chart && msg.chartData" flat bordered
                                class="q-mt-sm q-mt-sm-md chart-card"
                                :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-white'">
                                <q-card-section class="q-pa-xs q-pa-sm-md">
                                    <div
                                        class="row items-center justify-between no-wrap q-mb-xs q-mb-sm-sm q-gutter-xs">
                                        <div class="row items-center no-wrap ellipsis col">
                                            <q-icon :name="getChartIcon(getEffectiveChartType(msg, index))"
                                                color="primary" size="18px" class="q-mr-xs col-auto" />
                                            <div class="text-caption text-sm-subtitle2 text-weight-bold ellipsis">
                                                {{ msg.chartData.title || 'Análise Gráfica' }}
                                            </div>
                                        </div>

                                        <!-- Controles do Gráfico: Alternar Tipo e Baixar PNG -->
                                        <div v-if="canSwitchChartType(msg.chart)"
                                            class="row items-center no-wrap col-auto q-gutter-xs">
                                            <q-btn flat dense round size="xs" icon="bar_chart"
                                                :color="getEffectiveChartType(msg, index) === 'bar' ? 'primary' : 'grey-6'"
                                                @click="setChartOverride(index, 'bar')">
                                                <q-tooltip>Barras verticais</q-tooltip>
                                            </q-btn>
                                            <q-btn flat dense round size="xs" icon="leaderboard"
                                                :color="getEffectiveChartType(msg, index) === 'horizontal_bar' ? 'primary' : 'grey-6'"
                                                @click="setChartOverride(index, 'horizontal_bar')">
                                                <q-tooltip>Barras horizontais</q-tooltip>
                                            </q-btn>
                                            <q-btn flat dense round size="xs" icon="donut_large"
                                                :color="getEffectiveChartType(msg, index) === 'doughnut' ? 'primary' : 'grey-6'"
                                                @click="setChartOverride(index, 'doughnut')">
                                                <q-tooltip>Rosca</q-tooltip>
                                            </q-btn>
                                            <q-btn flat dense round size="xs" icon="image" color="grey-6"
                                                @click="downloadChartImage(index, msg.chartData.title)">
                                                <q-tooltip>Salvar gráfico (PNG)</q-tooltip>
                                            </q-btn>
                                        </div>
                                    </div>

                                    <div :ref="(el) => setChartContainerRef(el, index)" class="chart-container"
                                        :style="{ height: getChartHeight(getEffectiveChartType(msg, index), msg.chartData) }">
                                        <component :is="resolveChartComponent(getEffectiveChartType(msg, index))"
                                            :data="buildChartData(getEffectiveChartType(msg, index), msg.chartData)"
                                            :options="buildChartOptions(getEffectiveChartType(msg, index), msg.chartData)" />
                                    </div>
                                </q-card-section>
                            </q-card>

                            <div class="row justify-end q-mt-xs">
                                <q-btn flat dense round size="xs"
                                    :icon="copiedIndex === index ? 'check' : 'content_copy'"
                                    :color="copiedIndex === index ? 'positive' : 'grey-5'"
                                    @click="copyResponse(msg.text, index)">
                                    <q-tooltip>{{ copiedIndex === index ? 'Copiado!' : 'Copiar texto' }}</q-tooltip>
                                </q-btn>
                            </div>
                        </div>
                    </q-chat-message>
                </div>

                <!-- Indicador de Carregamento Dinâmico -->
                <div v-if="isTyping" class="row items-center q-ml-sm q-ml-sm-md q-my-sm text-grey-6">
                    <q-spinner-dots size="1.8em" color="primary" class="q-mr-xs" />
                    <span class="text-caption">{{ currentLoadingStep }}</span>
                </div>
            </q-card-section>

            <q-separator />

            <!-- Entrada Fixa -->
            <q-card-section class="col-auto q-pa-xs q-pa-sm-sm input-area">
                <!-- Seletor de Categoria + Prompts Sugeridos -->
                <div class="row items-center no-wrap q-gutter-xs q-mb-xs">
                    <q-btn-toggle v-model="promptCategory" dense no-caps unelevated size="xs"
                        toggle-color="deep-purple-6" :color="$q.dark.isActive ? 'grey-8' : 'grey-3'"
                        :text-color="$q.dark.isActive ? 'grey-3' : 'grey-8'" class="col-auto category-toggle" :options="[
                            { label: 'KDD', value: 'kdd', icon: 'hub' },
                            { label: 'ERP', value: 'erp', icon: 'store' }
                        ]" />

                    <div class="row no-wrap scroll q-gutter-xs quick-prompts-bar col">
                        <q-btn v-for="(item, idx) in activeQuickPrompts" :key="`${promptCategory}-${idx}`" outline dense
                            size="sm" :color="promptCategory === 'kdd' ? 'deep-purple-6' : 'primary'" :icon="item.icon"
                            :label="item.label" no-caps no-wrap class="q-px-sm quick-prompt-btn" :disable="isTyping"
                            @click="sendQuickPrompt(item)" />
                    </div>
                </div>

                <!-- Campo de Digitação -->
                <div class="row items-end q-gutter-xs no-wrap">
                    <q-input v-model="newMessage" dense outlined autogrow :max-height="$q.screen.xs ? 84 : 120"
                        class="col" :placeholder="inputPlaceholder" :disable="isTyping"
                        @keydown.enter.exact.prevent="sendMessage">
                        <template v-if="$q.screen.gt.xs" #prepend>
                            <q-icon :name="promptCategory === 'kdd' ? 'hub' : 'auto_awesome'"
                                :color="promptCategory === 'kdd' ? 'deep-purple-6' : 'primary'" size="18px" />
                        </template>
                    </q-input>
                    <q-btn :color="promptCategory === 'kdd' ? 'deep-purple-6' : 'primary'" icon="send" unelevated
                        :round="$q.screen.xs" :dense="$q.screen.xs" class="send-btn"
                        :disable="!newMessage.trim() || isTyping" @click="sendMessage" />
                </div>
            </q-card-section>
        </q-card>

        <!-- Modal Informativo do Pipeline KDD -->
        <q-dialog v-model="kddInfoDialog">
            <q-card style="max-width: 560px; width: 95vw;">
                <q-card-section class="row items-center justify-between q-pb-xs">
                    <div class="row items-center q-gutter-xs">
                        <q-icon name="hub" color="deep-purple-6" size="22px" />
                        <span class="text-subtitle1 text-weight-bold">Arquitetura Big Data & KDD</span>
                    </div>
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-separator />

                <q-card-section class="q-gutter-sm text-body2">
                    <p class="q-mb-xs">
                        O assistente cruza os dados transacionais do <strong>Simples Gestão</strong> com a
                        <strong>Camada Gold</strong> minerada offline a partir de bases públicas governamentais:
                    </p>

                    <q-list bordered separator dense class="rounded-borders">
                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="filter_alt" color="primary" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold">1. Seleção & Pré-processamento (Bronze →
                                    Silver)</q-item-label>
                                <q-item-label caption>
                                    Leitura em chunks de <strong>40,5 milhões de CNPJs</strong> (Receita Federal),
                                    <strong>1,36 milhão</strong> de registros da ANVISA e séries históricas do BCB/IBGE.
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="shopping_basket" color="teal" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold">2. Regras de Associação (Apriori)</q-item-label>
                                <q-item-label caption>
                                    Identifica itens comprados juntos (Suporte, Confiança e Lift) para sugerir combos de
                                    venda.
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="groups" color="deep-purple-6" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold">3. Clusterização B2B (K-Means)</q-item-label>
                                <q-item-label caption>
                                    Segmenta <strong>12.396 empresas ativas</strong> no Pará por CNAE e tempo de
                                    operação para
                                    prospecção.
                                </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="account_balance" color="amber-9" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold">4. Política de Crédito (Árvore de Decisão +
                                    BCB)</q-item-label>
                                <q-item-label caption>
                                    Compara inadimplência interna com a média PJ do Banco Central e define travas de
                                    prazo.
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Fechar" color="grey-7" no-caps v-close-popup />
                    <q-btn unelevated label="Executar Diagnóstico KDD" color="deep-purple-6" icon="play_arrow" no-caps
                        v-close-popup @click="runFullKddDiagnostic" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import { useQuasar, copyToClipboard } from 'quasar'
import { api } from '@/boot/axios'

import LineChart from '@/components/LineChart.vue'
import BarChart from '@/components/BarChart.vue'
import DoughnutChart from '@/components/DoughnutChart.vue'

const $q = useQuasar()
const STORAGE_KEY = 'simples_gestao_ia_chat_v1'

const messagesContainer = ref(null)
const newMessage = ref('')
const isTyping = ref(false)
const copiedIndex = ref(null)
const kddInfoDialog = ref(false)
const promptCategory = ref('kdd')
const chartTypeOverrides = ref({})
const chartContainers = ref({})

// Calcula a altura exata descontando automaticamente Header + Footer do QLayout
const layoutOffset = ref(0)
const pageStyleFn = (offset, height) => {
    layoutOffset.value = offset
    return {
        height: `${height - offset}px`,
        minHeight: `${height - offset}px`
    }
}

const cardStyle = computed(() => {
    if ($q.screen.xs) {
        return {
            height: '100%',
            borderRadius: '0px'
        }
    }
    return {
        height: '100%',
        maxWidth: '1120px'
    }
})

const inputPlaceholder = computed(() =>
    $q.screen.xs
        ? 'Pergunte sobre ERP, KDD, leads B2B...'
        : 'Pergunte sobre vendas, KDD (Receita Federal, BCB, Apriori) ou estoque... (Enter para enviar)'
)

const getCurrentTime = () =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const createWelcomeMessage = () => ({
    sent: false,
    text: '<p>Olá! Sou o seu assistente de relatórios inteligente conectado ao <strong>ERP Simples Gestão</strong> e à base minerada de <strong>Big Data & KDD</strong>.</p><p>Escolha um atalho abaixo (<strong>KDD</strong> ou <strong>ERP</strong>) ou digite sua pergunta para cruzar vendas, crédito, combos Apriori e leads B2B.</p>',
    chart: null,
    chartData: null,
    stamp: getCurrentTime()
})

const loadInitialMessages = () => {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed) && parsed.length) return parsed
        }
    } catch {
        // Ignora erro de storage
    }
    return [createWelcomeMessage()]
}

const messages = ref(loadInitialMessages())

watch(
    messages,
    (val) => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(val.slice(-30)))
        } catch {
            // Ignora quota excedida
        }
    },
    { deep: true }
)

// ==============================================================================
// PROMPTS RÁPIDOS (KDD BIG DATA vs. ERP OPERACIONAL)
// ==============================================================================
const kddPrompts = [
    {
        label: 'Diagnóstico Completo ERP × KDD',
        icon: 'insights',
        prompt:
            'Faça um diagnóstico completo cruzando minhas vendas dos últimos 365 dias e minhas contas a receber com os dados externos do KDD (Receita Federal, ANVISA e Banco Central). Mostre o volume de dados analisados, gere um gráfico da minha situação financeira e liste leads B2B reais e combos de produtos.'
    },
    {
        label: 'Leads B2B no Pará (Receita Federal)',
        icon: 'domain_add',
        prompt:
            'Com base na mineração da Receita Federal no Pará (K-Means), quantos potenciais compradores B2B e concorrentes existem no meu setor, quais segmentos dominam e quais empresas reais devo prospectar primeiro? Gere um gráfico dos segmentos.'
    },
    {
        label: 'Combos e Cestas (Apriori)',
        icon: 'shopping_basket',
        prompt:
            'Analise os produtos mais vendidos dos últimos 365 dias e cruze com as regras de associação (Apriori) do KDD para recomendar kits promocionais com maior Lift e Confiança. Mostre um gráfico do ranking de produtos.'
    },
    {
        label: 'Risco de Crédito vs. Banco Central',
        icon: 'account_balance',
        prompt:
            'Compare minhas parcelas vencidas e a receber com a taxa oficial de inadimplência PJ e juros de capital de giro do Banco Central (KDD) e explique as regras da árvore de decisão para vendas a prazo.'
    }
]

const erpPrompts = [
    {
        label: 'Previsão de demanda (30d)',
        icon: 'trending_up',
        prompt: 'Qual a previsão de demanda para os próximos 30 dias usando base de 365 dias e o que devo fazer agora?'
    },
    {
        label: 'Resumo de vendas (365d)',
        icon: 'payments',
        prompt: 'Qual o resumo de vendas e principais clientes dos últimos 365 dias?'
    },
    {
        label: 'Produtos com estoque crítico',
        icon: 'warning_amber',
        prompt: 'Quais produtos estão com estoque crítico ou zerado no momento?'
    },
    {
        label: 'Contas a receber e atrasos',
        icon: 'receipt_long',
        prompt: 'Como está a situação das contas a receber e parcelas vencidas?'
    }
]

const activeQuickPrompts = computed(() =>
    promptCategory.value === 'kdd' ? kddPrompts : erpPrompts
)

// Indicador de carregamento rotativo
const loadingSteps = [
    'Consultando dados do ERP e Camada Gold KDD...',
    'Cruzando indicadores da Receita Federal e Banco Central...',
    'Processando regras Apriori e estruturando visualização...'
]
const loadingStepIndex = ref(0)
let loadingTimer = null

const currentLoadingStep = computed(() => loadingSteps[loadingStepIndex.value])

watch(isTyping, (typing) => {
    if (typing) {
        loadingStepIndex.value = 0
        loadingTimer = setInterval(() => {
            loadingStepIndex.value = (loadingStepIndex.value + 1) % loadingSteps.length
        }, 2400)
    } else if (loadingTimer) {
        clearInterval(loadingTimer)
        loadingTimer = null
    }
})

onUnmounted(() => {
    if (loadingTimer) clearInterval(loadingTimer)
})

// ==============================================================================
// MOTOR SEMÂNTICO DE CORES E CONFIGURAÇÃO DOS GRÁFICOS (VUE-CHARTJS)
// ==============================================================================
const SEMANTIC_COLORS = {
    critical: '#E53935',   // Vermelho: vencido, zerado, crítico, inadimplência ERP, ruptura
    warning: '#FB8C00',    // Laranja/Âmbar: atenção, baixo giro, pendente, juros, excesso
    positive: '#10B981',   // Verde esmeralda: a receber, em dia, pago, saudável, faturamento
    benchmark: '#6366F1',  // Índigo/Roxo: BCB, mercado, média nacional, ANVISA, Receita Federal
    expansion: '#00897B',  // Teal: leads B2B, varejistas, supermercados, prospecção
    neutral: '#64748B'     // Cinza ardósia: inativo, outros
}

// Paleta harmônica para rankings neutros (nomes de produtos/clientes sem status)
const NEUTRAL_RANKING_PALETTE = [
    '#1976D2', // Azul primário
    '#00897B', // Verde-azulado (Teal)
    '#5E35B1', // Roxo profundo
    '#0288D1', // Azul oceano
    '#3949AB', // Índigo
    '#00ACC1', // Ciano
    '#43A047', // Verde médio
    '#6D4C41', // Marrom café
    '#546E7A'  // Azul acinzentado
]

const KEYWORD_RULES = [
    // 1. Benchmarks externos / KDD (avaliados antes para "Inadimplência BCB" ficar roxo/índigo e contrastar com ERP vermelho)
    {
        color: SEMANTIC_COLORS.benchmark,
        keywords: [
            'bcb', 'banco central', 'mercado', 'media nacional', 'media setorial',
            'referencia', 'benchmark', 'kdd', 'anvisa', 'receita federal', 'concorrente', 'fabricante'
        ]
    },
    // 2. Crítico / Negativo / Ruptura / Atraso (Vermelho)
    {
        color: SEMANTIC_COLORS.critical,
        keywords: [
            'vencido', 'vencida', 'vencidas', 'atraso', 'atrasado', 'atrasada',
            'zerado', 'zerada', 'zero', 'critico', 'critica', 'ruptura',
            'inadimplencia', 'inadimplente', 'calote', 'divida', 'prejuizo',
            'risco alto', 'alto risco', 'perda', 'cancelado', 'bloqueado',
            'negativo', 'falta', 'ficticio', 'urgente'
        ]
    },
    // 3. Atenção / Alerta Moderado / Custo (Âmbar / Laranja)
    {
        color: SEMANTIC_COLORS.warning,
        keywords: [
            'atencao', 'alerta', 'pendente', 'baixo', 'baixa', 'minimo',
            'risco medio', 'moderado', 'giro lento', 'sazonal', 'juros',
            'capital de giro', 'excesso', 'parado', 'reavaliar', 'oscilacao'
        ]
    },
    // 4. Positivo / Saudável / Entrada de Caixa (Verde Esmeralda)
    {
        color: SEMANTIC_COLORS.positive,
        keywords: [
            'a receber', 'em dia', 'no prazo', 'pago', 'paga', 'recebido',
            'quitado', 'lucro', 'positivo', 'saudavel', 'ok', 'normal',
            'meta', 'crescimento', 'faturamento', 'receita', 'ativo',
            'concluido', 'aprovado', 'fidelizado'
        ]
    },
    // 5. Segmentos B2B / Leads / Expansão Comercial (Teal)
    {
        color: SEMANTIC_COLORS.expansion,
        keywords: [
            'lead', 'b2b', 'prospeccao', 'supermercado', 'minimercado',
            'mercearia', 'lavanderia', 'estetica automotiva', 'atacado', 'varejo'
        ]
    },
    // 6. Neutro / Inativo
    {
        color: SEMANTIC_COLORS.neutral,
        keywords: ['inativo', 'descontinuado', 'outros', 'nao informado']
    }
]

const normalizeKeywordText = (text) =>
    String(text ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

const hexToRgba = (hex, alpha = 0.16) => {
    const clean = String(hex || '#1976D2').replace('#', '')
    if (clean.length !== 6) return `rgba(25, 118, 210, ${alpha})`
    const r = parseInt(clean.slice(0, 2), 16)
    const g = parseInt(clean.slice(2, 4), 16)
    const b = parseInt(clean.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const resolveSemanticColor = (label, index = 0, contextTitle = '', value = null) => {
    const normLabel = normalizeKeywordText(label)
    const normTitle = normalizeKeywordText(contextTitle)

    // Regra contextual: em gráficos de estoque/saldo, valor <= 0 fica vermelho imediatamente
    const isStockContext =
        normTitle.includes('estoque') ||
        normTitle.includes('saldo') ||
        normTitle.includes('cobertura')
    if (isStockContext && value !== null && Number(value) <= 0) {
        return SEMANTIC_COLORS.critical
    }

    for (const rule of KEYWORD_RULES) {
        if (rule.keywords.some((kw) => normLabel.includes(kw))) {
            return rule.color
        }
    }

    return NEUTRAL_RANKING_PALETTE[index % NEUTRAL_RANKING_PALETTE.length]
}

const theme = computed(() => ({
    text: $q.dark.isActive ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
    grid: $q.dark.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    tooltipBg: $q.dark.isActive ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.95)',
    tooltipText: $q.dark.isActive ? '#fff' : '#333'
}))

const canSwitchChartType = (chartType) => chartType !== 'line'

const getEffectiveChartType = (msg, index) =>
    chartTypeOverrides.value[index] || msg.chart

const setChartOverride = (index, type) => {
    chartTypeOverrides.value = { ...chartTypeOverrides.value, [index]: type }
}

const setChartContainerRef = (el, index) => {
    if (el) chartContainers.value[index] = el
}

const downloadChartImage = (index, title = 'grafico-relatorio') => {
    const container = chartContainers.value[index]
    const canvas = container?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    const slug = String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    link.download = `${slug || 'grafico'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
}

const resolveChartComponent = (chartType) => {
    if (chartType === 'line') return LineChart
    if (chartType === 'doughnut' || chartType === 'pie') return DoughnutChart
    return BarChart
}

const getChartIcon = (chartType) => {
    if (chartType === 'line') return 'show_chart'
    if (chartType === 'doughnut' || chartType === 'pie') return 'donut_large'
    if (chartType === 'horizontal_bar') return 'leaderboard'
    return 'bar_chart'
}

const getChartHeight = (chartType, chartData) => {
    const count = chartData?.labels?.length || 5
    const isMobile = $q.screen.lt.sm
    if (chartType === 'horizontal_bar') {
        const rowHeight = isMobile ? 38 : 44
        const minHeight = isMobile ? 210 : 240
        return `${Math.max(minHeight, count * rowHeight + 36)}px`
    }
    return isMobile ? '220px' : '270px'
}

const truncateLabel = (label, maxLength) => {
    const str = String(label ?? '')
    return str.length > maxLength ? `${str.slice(0, maxLength - 1)}…` : str
}

const formatMetricValue = (value, unit = 'currency') => {
    const num = Number(value || 0)
    if (unit === 'currency') {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
    }
    if (unit === 'percent') {
        return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(num)}%`
    }
    return `${new Intl.NumberFormat('pt-BR').format(num)} un`
}

const formatAxisTick = (value, unit = 'currency') => {
    const num = Number(value || 0)
    if (unit === 'currency') {
        if (Math.abs(num) >= 1000) {
            return `R$ ${(num / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
        }
        return `R$ ${num.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
    }
    if (unit === 'percent') return `${num}%`
    return `${num}`
}

const buildChartData = (chartType, chartData) => {
    const labels = Array.isArray(chartData?.labels) ? chartData.labels : []
    const series = Array.isArray(chartData?.series) ? chartData.series : []
    const title = chartData?.title || ''

    if (chartType === 'line') {
        return {
            labels,
            datasets: series.map((s, idx) => {
                const color = resolveSemanticColor(s.name || title, idx, title)
                return {
                    label: s.name || 'Série',
                    data: (s.data || []).map((v) => Number(v) || 0),
                    borderColor: color,
                    backgroundColor: hexToRgba(color, 0.16),
                    fill: series.length === 1,
                    tension: 0.35,
                    borderWidth: 2.2,
                    pointRadius: $q.screen.xs ? 2.5 : 3.5,
                    pointHoverRadius: 5.5,
                    pointBackgroundColor: color,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 1.5
                }
            })
        }
    }

    if (chartType === 'doughnut' || chartType === 'pie') {
        const firstSerie = series[0] || { name: '', data: [] }
        const values = (firstSerie.data || []).map((v) => Number(v) || 0)
        return {
            labels,
            datasets: [
                {
                    label: firstSerie.name || title || '',
                    data: values,
                    backgroundColor: labels.map((lbl, i) =>
                        resolveSemanticColor(lbl, i, title, values[i])
                    ),
                    borderWidth: 0,
                    hoverOffset: 6
                }
            ]
        }
    }

    return {
        labels,
        datasets: series.map((s, idx) => {
            const values = (s.data || []).map((v) => Number(v) || 0)
            const bgColors =
                series.length === 1
                    ? labels.map((lbl, i) => resolveSemanticColor(lbl, i, title, values[i]))
                    : resolveSemanticColor(s.name || title, idx, title)

            return {
                label: s.name || 'Valor',
                data: values,
                backgroundColor: bgColors,
                borderRadius: 6,
                maxBarThickness: $q.screen.xs ? 26 : 36
            }
        })
    }
}

const buildChartOptions = (chartType, chartData) => {
    const unit = chartData?.unit || 'currency'
    const hasMultipleSeries = (chartData?.series?.length || 0) > 1
    const isMobile = $q.screen.xs
    const tickFontSize = isMobile ? 10 : 11
    const labels = Array.isArray(chartData?.labels) ? chartData.labels : []

    if (chartType === 'doughnut' || chartType === 'pie') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            cutout: chartType === 'doughnut' ? '58%' : '0%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: theme.value.text,
                        boxWidth: isMobile ? 10 : 12,
                        padding: isMobile ? 10 : 14,
                        font: { size: tickFontSize }
                    }
                },
                tooltip: {
                    backgroundColor: theme.value.tooltipBg,
                    titleColor: theme.value.tooltipText,
                    bodyColor: theme.value.tooltipText,
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((acc, v) => acc + (Number(v) || 0), 0)
                            const pct = total > 0 ? ((Number(ctx.parsed) / total) * 100).toFixed(1) : '0.0'
                            return ` ${ctx.label}: ${formatMetricValue(ctx.parsed, unit)} (${pct}%)`
                        }
                    }
                }
            }
        }
    }

    const isHorizontal = chartType === 'horizontal_bar'

    return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isHorizontal ? 'y' : 'x',
        plugins: {
            legend: {
                display: hasMultipleSeries,
                position: 'bottom',
                labels: { color: theme.value.text, boxWidth: 10, font: { size: tickFontSize } }
            },
            tooltip: {
                backgroundColor: theme.value.tooltipBg,
                titleColor: theme.value.tooltipText,
                bodyColor: theme.value.tooltipText,
                callbacks: {
                    title: (items) => {
                        const idx = items?.[0]?.dataIndex ?? 0
                        return labels[idx] ?? items?.[0]?.label ?? ''
                    },
                    label: (ctx) => {
                        const rawVal = isHorizontal ? ctx.parsed.x : ctx.parsed.y
                        return ` ${ctx.dataset.label}: ${formatMetricValue(rawVal, unit)}`
                    }
                }
            }
        },
        scales: isHorizontal
            ? {
                x: {
                    beginAtZero: true,
                    grid: { color: theme.value.grid },
                    ticks: {
                        color: theme.value.text,
                        font: { size: tickFontSize },
                        maxTicksLimit: isMobile ? 4 : 6,
                        callback: (val) => formatAxisTick(val, unit)
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: theme.value.text,
                        font: { size: tickFontSize },
                        callback: (_, index) => truncateLabel(labels[index], isMobile ? 13 : 24)
                    }
                }
            }
            : {
                y: {
                    beginAtZero: true,
                    grid: { color: theme.value.grid },
                    ticks: {
                        color: theme.value.text,
                        font: { size: tickFontSize },
                        maxTicksLimit: isMobile ? 5 : 7,
                        callback: (val) => formatAxisTick(val, unit)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: theme.value.text,
                        font: { size: tickFontSize },
                        maxRotation: isMobile ? 35 : 0,
                        callback: (_, index) => truncateLabel(labels[index], isMobile ? 10 : 18)
                    }
                }
            }
    }
}

// ==============================================================================
// SANITIZAÇÃO E FORMATAÇÃO DE TEXTO (HTML + MARKDOWN)
// ==============================================================================
const ALLOWED_TAGS = new Set([
    'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S',
    'UL', 'OL', 'LI',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
    'BLOCKQUOTE', 'PRE', 'CODE', 'HR', 'SPAN', 'DIV'
])

const BLOCKED_TAGS = new Set([
    'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'TEXTAREA', 'BUTTON', 'LINK', 'META', 'IMG', 'SVG'
])

const normalizeMarkdownToHtml = (input) => {
    let text = String(input || '').replace(/\r\n/g, '\n').trim()
    if (!text) return ''

    // Remove imagens markdown inline e placeholders ![Gráfico ... registrado]
    text = text.replace(/!\[[^\]]*\]\(data:image\/[^)]+\)/gi, '')

    // Remove blocos de código contendo caixas ASCII (┌─┐│└┘) gerados por engano pelo LLM
    text = text.replace(/```[\s\S]*?```/g, (match) => {
        const inner = match.replace(/^```[^\n]*\n?|\n?```$/g, '').trim()
        if (/[┌┐└┘│─┬┴├┤┼]/.test(inner)) {
            return ''
        }
        return `<pre><code>${inner}</code></pre>`
    })

    text = text
        .replace(/`([^`\n]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')

    text = text.replace(/(?:<br\s*\/?>\s*){2,}/gi, '\n\n')
    text = text.replace(/<br\s*\/?>/gi, '\n')

    const blocks = text.split(/\n{2,}/)

    return blocks
        .map((block) => {
            const trimmed = block.trim()
            if (!trimmed) return ''

            if (/^-{3,}$/.test(trimmed)) {
                return '<hr>'
            }

            if (/^<(p|ul|ol|table|h[1-6]|blockquote|pre|div|hr)\b/i.test(trimmed)) {
                return trimmed
            }

            const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
            if (!lines.length) return ''

            if (lines.length >= 2 && lines[0].includes('|') && /^\|?[\s-:|]+\|?$/.test(lines[1])) {
                const parseRow = (row) =>
                    row
                        .replace(/^\||\|$/g, '')
                        .split('|')
                        .map((cell) => cell.trim())

                const headers = parseRow(lines[0])
                const bodyRows = lines.slice(2).map(parseRow)

                const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`
                const tbody = `<tbody>${bodyRows
                    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
                    .join('')}</tbody>`

                return `<table>${thead}${tbody}</table>`
            }

            if (/^#{1,3}\s+/.test(lines[0])) {
                const level = lines[0].match(/^(#{1,3})/)[1].length
                const tag = level === 1 ? 'h4' : level === 2 ? 'h5' : 'h6'
                const title = lines[0].replace(/^#{1,3}\s+/, '')
                const rest = lines.slice(1).join('<br>')
                return `<${tag}>${title}</${tag}>${rest ? `<p>${rest}</p>` : ''}`
            }

            if (lines.every((l) => /^[•\-*]\s+/.test(l))) {
                const items = lines
                    .map((l) => `<li>${l.replace(/^[•\-*]\s+/, '')}</li>`)
                    .join('')
                return `<ul>${items}</ul>`
            }

            if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
                const items = lines
                    .map((l) => `<li>${l.replace(/^\d+[.)]\s+/, '')}</li>`)
                    .join('')
                return `<ol>${items}</ol>`
            }

            if (lines.every((l) => l.startsWith('>'))) {
                return `<blockquote>${lines.map((l) => l.replace(/^>\s?/, '')).join('<br>')}</blockquote>`
            }

            return `<p>${lines.join('<br>')}</p>`
        })
        .join('')
}

const sanitizeHtml = (dirtyHtml) => {
    if (!dirtyHtml) return ''

    const parser = new DOMParser()
    const doc = parser.parseFromString(dirtyHtml, 'text/html')

    const cleanNode = (node) => {
        const children = Array.from(node.childNodes)

        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toUpperCase()

                if (BLOCKED_TAGS.has(tag)) {
                    child.remove()
                    continue
                }

                cleanNode(child)

                if (!ALLOWED_TAGS.has(tag)) {
                    const parent = child.parentNode
                    while (child.firstChild) {
                        parent.insertBefore(child.firstChild, child)
                    }
                    parent.removeChild(child)
                    continue
                }

                for (const attr of Array.from(child.attributes)) {
                    const attrName = attr.name.toLowerCase()
                    const isTableAttr = (tag === 'TD' || tag === 'TH') && (attrName === 'colspan' || attrName === 'rowspan')
                    const isSafeWrapperClass = tag === 'DIV' && attrName === 'class' && attr.value === 'table-wrapper'

                    if (!isTableAttr && !isSafeWrapperClass) {
                        child.removeAttribute(attr.name)
                    }
                }

                if (tag === 'LI') {
                    while (child.lastElementChild && child.lastElementChild.tagName === 'BR') {
                        child.lastElementChild.remove()
                    }
                }
            }
        }
    }

    cleanNode(doc.body)

    doc.body.querySelectorAll('table').forEach((table) => {
        if (!table.parentElement?.classList.contains('table-wrapper')) {
            const wrapper = doc.createElement('div')
            wrapper.className = 'table-wrapper'
            table.parentNode.insertBefore(wrapper, table)
            wrapper.appendChild(table)
        }
    })

    return doc.body.innerHTML
}

const renderFormattedContent = (rawText) => {
    const html = normalizeMarkdownToHtml(rawText)
    return sanitizeHtml(html)
}

const copyResponse = async (rawText, index) => {
    const formattedHtml = renderFormattedContent(rawText)
    const parser = new DOMParser()
    const doc = parser.parseFromString(formattedHtml, 'text/html')

    doc.querySelectorAll('li').forEach((li) => {
        li.textContent = `• ${li.textContent.trim()}`
    })

    const blocks = Array.from(doc.body.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, tr, blockquote'))
    const plainText = blocks.length
        ? blocks.map((el) => el.innerText || el.textContent).join('\n').trim()
        : (doc.body.textContent || '').trim()

    await copyToClipboard(plainText)
    copiedIndex.value = index
    setTimeout(() => {
        if (copiedIndex.value === index) copiedIndex.value = null
    }, 2000)
}

const exportChatMarkdown = () => {
    const lines = [
        '# Relatório Analítico — Simples Gestão (ERP + KDD)',
        `_Gerado em: ${new Date().toLocaleString('pt-BR')}_\n`
    ]

    messages.value.forEach((msg) => {
        const author = msg.sent ? 'Usuário' : 'Assistente IA'
        const cleanBody = String(msg.text || '').replace(/<[^>]+>/g, '').trim()
        lines.push(`## ${author} (${msg.stamp})\n${cleanBody}\n`)
    })

    const blob = new Blob([lines.join('\n---\n\n')], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-ia-kdd-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
}

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value?.$el) {
            messagesContainer.value.$el.scrollTop = messagesContainer.value.$el.scrollHeight
        }
    })
}

const clearChat = () => {
    messages.value = [createWelcomeMessage()]
    chartTypeOverrides.value = {}
    sessionStorage.removeItem(STORAGE_KEY)
}

const sendMessage = async (categoryOverride = null) => {
    const text = newMessage.value.trim()
    if (!text || isTyping.value) return

    const category = categoryOverride || promptCategory.value
    messages.value.push({ sent: true, text, category, stamp: getCurrentTime() })
    newMessage.value = ''
    isTyping.value = true
    scrollToBottom()

    try {
        const response = await api.post('/relatorios-ia/', { mensagem: text })
        const payload = response.data || {}

        messages.value.push({
            sent: false,
            text: payload.resposta || 'Não foi possível obter uma resposta válida.',
            chart: payload.chart || null,
            chartData: payload.data || null,
            stamp: getCurrentTime()
        })
    } catch {
        messages.value.push({
            sent: false,
            text: '<p>Desculpe, ocorreu um erro ao consultar o assistente de relatórios. Tente novamente mais tarde.</p>',
            chart: null,
            chartData: null,
            stamp: getCurrentTime()
        })
    } finally {
        isTyping.value = false
        scrollToBottom()
    }
}

const sendQuickPrompt = (item) => {
    newMessage.value = item.prompt
    sendMessage(promptCategory.value)
}

const runFullKddDiagnostic = () => {
    promptCategory.value = 'kdd'
    sendQuickPrompt(kddPrompts[0])
}
</script>

<style scoped>
.messages-area {
    overflow-x: hidden;
}

.responsive-chat-message {
    width: 100%;
    max-width: 100%;
}

.responsive-chat-message :deep(.q-message-container) {
    width: 100%;
    max-width: 100%;
    min-width: 0;
}

.responsive-chat-message :deep(.q-message-container > div) {
    min-width: 0;
    max-width: 100%;
}

.responsive-chat-message :deep(.q-message-text) {
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
}

.responsive-chat-message :deep(.q-message-text-content) {
    min-width: 0;
    max-width: 100%;
}

.ai-message-wrapper {
    min-width: 0;
    max-width: 100%;
    width: 100%;
}

.user-message {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.45;
}

.chart-card {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
}

.chart-container {
    position: relative;
    width: 100%;
    min-width: 0;
}

.category-toggle {
    flex-shrink: 0;
    border-radius: 6px;
}

.quick-prompts-bar {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.quick-prompts-bar::-webkit-scrollbar {
    display: none;
}

.quick-prompt-btn {
    flex-shrink: 0;
    white-space: nowrap;
}

.send-btn {
    min-height: 40px;
    flex-shrink: 0;
}

.rich-content {
    font-size: 0.92rem;
    line-height: 1.55;
    word-break: break-word;
    overflow-wrap: anywhere;
    max-width: 100%;
}

.rich-content :deep(p) {
    margin: 0 0 0.75em 0;
}

.rich-content :deep(p:last-child),
.rich-content :deep(ul:last-child),
.rich-content :deep(ol:last-child),
.rich-content :deep(blockquote:last-child),
.rich-content :deep(.table-wrapper:last-child) {
    margin-bottom: 0;
}

.rich-content :deep(hr) {
    border: none;
    border-top: 1px solid rgba(128, 128, 128, 0.25);
    margin: 0.8em 0;
}

.rich-content :deep(strong),
.rich-content :deep(b) {
    font-weight: 600;
}

.rich-content :deep(h1),
.rich-content :deep(h2),
.rich-content :deep(h3),
.rich-content :deep(h4),
.rich-content :deep(h5),
.rich-content :deep(h6) {
    margin: 0.45em 0 0.4em 0;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: normal;
}

.rich-content :deep(h1),
.rich-content :deep(h2) {
    font-size: 1.08rem;
}

.rich-content :deep(h3),
.rich-content :deep(h4) {
    font-size: 1rem;
}

.rich-content :deep(h5),
.rich-content :deep(h6) {
    font-size: 0.94rem;
}

.rich-content :deep(ul),
.rich-content :deep(ol) {
    margin: 0 0 0.75em 0;
    padding-left: 1.25em;
}

.rich-content :deep(li) {
    margin-bottom: 0.35em;
}

.rich-content :deep(li:last-child) {
    margin-bottom: 0;
}

.rich-content :deep(pre) {
    background-color: rgba(0, 0, 0, 0.06);
    padding: 0.65em 0.8em;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.82rem;
    margin: 0.5em 0 0.75em 0;
}

.rich-content :deep(code) {
    background-color: rgba(0, 0, 0, 0.08);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.86em;
}

.rich-content :deep(pre code) {
    background-color: transparent;
    padding: 0;
}

.rich-content :deep(blockquote) {
    border-left: 3px solid var(--q-primary);
    margin: 0 0 0.75em 0;
    padding-left: 0.75em;
    opacity: 0.9;
}

.rich-content :deep(.table-wrapper) {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 0.5em 0 0.75em 0;
    border-radius: 6px;
}

.rich-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
}

.rich-content :deep(th),
.rich-content :deep(td) {
    border: 1px solid rgba(0, 0, 0, 0.14);
    padding: 6px 8px;
    text-align: left;
    white-space: nowrap;
}

.rich-content :deep(th) {
    background-color: rgba(0, 0, 0, 0.05);
    font-weight: 600;
}

@media (max-width: 599px) {
    .rich-content {
        font-size: 0.85rem;
    }

    .rich-content :deep(h1),
    .rich-content :deep(h2) {
        font-size: 0.98rem;
    }

    .rich-content :deep(h3),
    .rich-content :deep(h4) {
        font-size: 0.92rem;
    }

    .rich-content :deep(table) {
        font-size: 0.76rem;
    }

    .rich-content :deep(th),
    .rich-content :deep(td) {
        padding: 5px 7px;
    }
}

/* Ajustes para Dark Mode */
:global(.body--dark) .rich-content :deep(pre),
:global(.body--dark) .rich-content :deep(code) {
    background-color: rgba(255, 255, 255, 0.12);
}

:global(.body--dark) .rich-content :deep(th),
:global(.body--dark) .rich-content :deep(td) {
    border-color: rgba(255, 255, 255, 0.16);
}

:global(.body--dark) .rich-content :deep(th) {
    background-color: rgba(255, 255, 255, 0.08);
}
</style>