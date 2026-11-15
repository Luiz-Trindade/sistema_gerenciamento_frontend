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
                </div>
                <q-btn v-if="messages.length > 1" flat dense size="sm" color="grey-6" icon="delete_sweep"
                    :label="$q.screen.xs ? '' : 'Limpar'" no-caps :disable="isTyping" @click="clearChat">
                    <q-tooltip v-if="$q.screen.xs">Limpar conversa</q-tooltip>
                </q-btn>
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
                        <div v-if="msg.sent" class="text-body2 user-message">{{ msg.text }}</div>

                        <!-- Resposta da IA -->
                        <div v-else class="ai-message-wrapper">
                            <div class="rich-content" v-html="renderFormattedContent(msg.text)"></div>

                            <!-- Card do Gráfico (vue-chartjs) -->
                            <q-card v-if="msg.chart && msg.chartData" flat bordered
                                class="q-mt-sm q-mt-sm-md chart-card"
                                :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-white'">
                                <q-card-section class="q-pa-xs q-pa-sm-md">
                                    <div class="row items-center no-wrap q-mb-xs q-mb-sm-sm">
                                        <q-icon :name="getChartIcon(msg.chart)" color="primary" size="18px"
                                            class="q-mr-xs col-auto" />
                                        <div class="text-caption text-sm-subtitle2 text-weight-bold ellipsis">
                                            {{ msg.chartData.title || 'Análise Gráfica' }}
                                        </div>
                                    </div>

                                    <div class="chart-container"
                                        :style="{ height: getChartHeight(msg.chart, msg.chartData) }">
                                        <component :is="resolveChartComponent(msg.chart)"
                                            :data="buildChartData(msg.chart, msg.chartData)"
                                            :options="buildChartOptions(msg.chart, msg.chartData)" />
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

                <!-- Indicador de Carregamento -->
                <div v-if="isTyping" class="row items-center q-ml-sm q-ml-sm-md q-my-sm text-grey-6">
                    <q-spinner-dots size="1.8em" color="primary" class="q-mr-xs" />
                    <span class="text-caption">Analisando dados do ERP...</span>
                </div>
            </q-card-section>

            <q-separator />

            <!-- Entrada Fixa -->
            <q-card-section class="col-auto q-pa-xs q-pa-sm-sm input-area">
                <!-- Prompts Sugeridos em linha única com scroll horizontal -->
                <div class="row no-wrap scroll q-gutter-xs q-mb-xs quick-prompts-bar">
                    <q-btn v-for="(prompt, idx) in quickPrompts" :key="idx" outline dense size="sm" color="primary"
                        :label="prompt" no-caps no-wrap class="q-px-sm quick-prompt-btn" :disable="isTyping"
                        @click="sendQuickPrompt(prompt)" />
                </div>

                <!-- Campo de Digitação -->
                <div class="row items-end q-gutter-xs no-wrap">
                    <q-input v-model="newMessage" dense outlined autogrow :max-height="$q.screen.xs ? 84 : 120"
                        class="col" :placeholder="inputPlaceholder" :disable="isTyping"
                        @keydown.enter.exact.prevent="sendMessage">
                        <template v-if="$q.screen.gt.xs" #prepend>
                            <q-icon name="auto_awesome" color="primary" size="18px" />
                        </template>
                    </q-input>
                    <q-btn color="primary" icon="send" unelevated :round="$q.screen.xs" :dense="$q.screen.xs"
                        class="send-btn" :disable="!newMessage.trim() || isTyping" @click="sendMessage" />
                </div>
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useQuasar, copyToClipboard } from 'quasar'
import { api } from '@/boot/axios'

import LineChart from '@/components/LineChart.vue'
import BarChart from '@/components/BarChart.vue'
import DoughnutChart from '@/components/DoughnutChart.vue'

const $q = useQuasar()
const messagesContainer = ref(null)
const newMessage = ref('')
const isTyping = ref(false)
const copiedIndex = ref(null)

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
        ? 'Pergunte sobre vendas, estoque ou demanda...'
        : 'Pergunte sobre vendas, estoque, demanda ou parcelas... (Shift+Enter para nova linha)'
)

const getCurrentTime = () =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const createWelcomeMessage = () => ({
    sent: false,
    text: '<p>Olá! Sou o seu assistente de relatórios inteligente.</p><p>Como posso ajudar com a gestão de <strong>vendas</strong>, <strong>estoque</strong>, <strong>previsão de demanda</strong> ou <strong>financeiro</strong> hoje?</p>',
    chart: null,
    chartData: null,
    stamp: getCurrentTime()
})

const messages = ref([createWelcomeMessage()])

const quickPrompts = [
    'Previsão de demanda e ações',
    'Resumo de vendas do mês',
    'Produtos com estoque crítico',
    'Previsão de recebimentos'
]

// ==============================================================================
// CONFIGURAÇÃO DOS GRÁFICOS (VUE-CHARTJS)
// ==============================================================================
const CHART_COLORS = [
    '#1976D2',
    '#4FC08D',
    '#F2C037',
    '#E53935',
    '#9C27B0',
    '#26A69A',
    '#607D8B'
]

const theme = computed(() => ({
    text: $q.dark.isActive ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
    grid: $q.dark.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    tooltipBg: $q.dark.isActive ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.95)',
    tooltipText: $q.dark.isActive ? '#fff' : '#333'
}))

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
        return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(num)}%`
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

    if (chartType === 'line') {
        return {
            labels,
            datasets: series.map((s, idx) => {
                const color = CHART_COLORS[idx % CHART_COLORS.length]
                return {
                    label: s.name || 'Série',
                    data: (s.data || []).map((v) => Number(v) || 0),
                    borderColor: color,
                    backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    fill: series.length === 1,
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: $q.screen.xs ? 2.5 : 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: color,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 1.5
                }
            })
        }
    }

    if (chartType === 'doughnut' || chartType === 'pie') {
        const firstSerie = series[0] || { name: '', data: [] }
        return {
            labels,
            datasets: [
                {
                    label: firstSerie.name || chartData?.title || '',
                    data: (firstSerie.data || []).map((v) => Number(v) || 0),
                    backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                    borderWidth: 0,
                    hoverOffset: 6
                }
            ]
        }
    }

    return {
        labels,
        datasets: series.map((s, idx) => ({
            label: s.name || 'Valor',
            data: (s.data || []).map((v) => Number(v) || 0),
            backgroundColor:
                series.length === 1
                    ? labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])
                    : CHART_COLORS[idx % CHART_COLORS.length],
            borderRadius: 6,
            maxBarThickness: $q.screen.xs ? 26 : 36
        }))
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

    text = text.replace(/!\[[^\]]*\]\(data:image\/[^)]+\)/gi, '')

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

    // Garante que TODA tabela (seja Markdown ou HTML puro da IA) tenha scroll horizontal isolado
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

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value?.$el) {
            messagesContainer.value.$el.scrollTop = messagesContainer.value.$el.scrollHeight
        }
    })
}

const clearChat = () => {
    messages.value = [createWelcomeMessage()]
}

const sendMessage = async () => {
    const text = newMessage.value.trim()
    if (!text || isTyping.value) return

    messages.value.push({ sent: true, text, stamp: getCurrentTime() })
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

const sendQuickPrompt = (promptText) => {
    newMessage.value = promptText
    sendMessage()
}
</script>

<style scoped>
.messages-area {
    overflow-x: hidden;
}

/* Trava a largura do balão do Quasar para nunca estourar a tela mobile */
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

/* Normaliza TODOS os títulos (h1..h6) para não ficarem gigantes no balão */
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

.rich-content :deep(code) {
    background-color: rgba(0, 0, 0, 0.08);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.86em;
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