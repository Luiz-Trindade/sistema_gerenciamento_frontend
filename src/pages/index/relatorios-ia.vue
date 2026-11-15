<template>
    <q-page class="q-pa-xs q-pa-sm-md flex flex-center">
        <q-card flat bordered class="column no-wrap overflow-hidden full-width"
            :style="{ height: $q.screen.lt.md ? 'calc(100vh - 135px)' : 'calc(100vh - 100px)' }">
            <!-- Cabeçalho discreto do Chat -->
            <q-card-section class="col-auto row items-center justify-between q-py-xs q-px-sm q-px-md-md">
                <div class="row items-center q-gutter-xs">
                    <q-icon name="auto_awesome" color="amber-8" size="20px" />
                    <span class="text-subtitle2 text-weight-medium">Assistente de Relatórios IA</span>
                </div>
                <q-btn v-if="messages.length > 1" flat dense size="sm" color="grey-6" icon="delete_sweep" label="Limpar"
                    no-caps :disable="isTyping" @click="clearChat" />
            </q-card-section>

            <q-separator />

            <!-- Área de Mensagens -->
            <q-card-section class="col scroll q-pa-sm q-pa-sm-md" ref="messagesContainer">
                <div v-for="(msg, index) in messages" :key="index" class="q-mb-md"
                    :class="msg.sent ? 'q-pl-md q-pl-sm-xl' : 'q-pr-xs q-pr-sm-lg'">
                    <q-chat-message :name="msg.sent ? 'Você' : 'Assistente IA'" :stamp="msg.stamp" :sent="msg.sent"
                        :bg-color="msg.sent ? 'primary' : ($q.dark.isActive ? 'grey-9' : 'grey-2')"
                        :text-color="msg.sent ? 'white' : ($q.dark.isActive ? 'grey-1' : 'grey-10')">
                        <template #avatar>
                            <q-avatar size="30px" class="q-mx-xs">
                                <q-icon v-if="!msg.sent" name="auto_awesome" color="amber-8" size="20px" />
                                <q-icon v-else name="person" color="primary" size="20px" />
                            </q-avatar>
                        </template>

                        <!-- Mensagem do Usuário -->
                        <div v-if="msg.sent" class="text-body2 user-message">{{ msg.text }}</div>

                        <!-- Resposta da IA -->
                        <div v-else class="ai-message-wrapper">
                            <div class="text-body2 rich-content" v-html="renderFormattedContent(msg.text)"></div>

                            <!-- Card do Gráfico (vue-chartjs) -->
                            <q-card v-if="msg.chart && msg.chartData" flat bordered class="q-mt-md"
                                :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-white'">
                                <q-card-section class="q-pa-sm q-pa-sm-md">
                                    <div class="row items-center q-mb-sm">
                                        <q-icon :name="getChartIcon(msg.chart)" color="primary" size="20px"
                                            class="q-mr-xs" />
                                        <div class="text-subtitle2 text-weight-bold">
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
                <div v-if="isTyping" class="row items-center q-ml-md q-my-sm text-grey-6">
                    <q-spinner-dots size="1.8em" color="primary" class="q-mr-xs" />
                    <span class="text-caption">Analisando dados do ERP...</span>
                </div>
            </q-card-section>

            <q-separator />

            <!-- Entrada Fixa -->
            <q-card-section class="col-auto q-pa-xs q-pa-sm-sm">
                <!-- Prompts Sugeridos -->
                <div class="row no-wrap scroll q-gutter-xs q-mb-xs q-pb-xs">
                    <q-btn v-for="(prompt, idx) in quickPrompts" :key="idx" outline dense size="sm" color="primary"
                        :label="prompt" no-caps class="no-shrink" :disable="isTyping"
                        @click="sendQuickPrompt(prompt)" />
                </div>

                <!-- Campo de Digitação -->
                <div class="row items-end q-gutter-xs">
                    <q-input v-model="newMessage" dense outlined autogrow :max-height="110" class="col"
                        placeholder="Pergunte sobre vendas, estoque ou parcelas... (Shift+Enter para nova linha)"
                        :disable="isTyping" @keydown.enter.exact.prevent="sendMessage">
                        <template #prepend>
                            <q-icon name="auto_awesome" color="primary" size="18px" />
                        </template>
                    </q-input>
                    <q-btn color="primary" icon="send" unelevated :disable="!newMessage.trim() || isTyping"
                        @click="sendMessage" />
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

const getCurrentTime = () =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const createWelcomeMessage = () => ({
    sent: false,
    text: '<p>Olá! Sou o seu assistente de relatórios inteligente.</p><p>Como posso ajudar com a gestão de <strong>vendas</strong>, <strong>estoque</strong> ou <strong>financeiro</strong> hoje?</p>',
    chart: null,
    chartData: null,
    stamp: getCurrentTime()
})

const messages = ref([createWelcomeMessage()])

const quickPrompts = [
    'Resumo de vendas do mês',
    'Resumo de vendas do ano',
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
    return BarChart // 'bar' e 'horizontal_bar'
}

const getChartIcon = (chartType) => {
    if (chartType === 'line') return 'show_chart'
    if (chartType === 'doughnut' || chartType === 'pie') return 'donut_large'
    if (chartType === 'horizontal_bar') return 'leaderboard'
    return 'bar_chart'
}

const getChartHeight = (chartType, chartData) => {
    const count = chartData?.labels?.length || 5
    if (chartType === 'horizontal_bar') {
        return `${Math.max(240, count * 44 + 40)}px`
    }
    return '270px'
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
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: color,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2
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

    // 'bar' ou 'horizontal_bar'
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
            maxBarThickness: 36
        }))
    }
}

const buildChartOptions = (chartType, chartData) => {
    const unit = chartData?.unit || 'currency'
    const hasMultipleSeries = (chartData?.series?.length || 0) > 1

    if (chartType === 'doughnut' || chartType === 'pie') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            cutout: chartType === 'doughnut' ? '60%' : '0%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: theme.value.text,
                        boxWidth: 12,
                        padding: 14,
                        font: { size: 11 }
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
                labels: { color: theme.value.text, boxWidth: 12, font: { size: 11 } }
            },
            tooltip: {
                backgroundColor: theme.value.tooltipBg,
                titleColor: theme.value.tooltipText,
                bodyColor: theme.value.tooltipText,
                callbacks: {
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
                        font: { size: 11 },
                        callback: (val) => formatAxisTick(val, unit)
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: theme.value.text,
                        font: { size: 11 }
                    }
                }
            }
            : {
                y: {
                    beginAtZero: true,
                    grid: { color: theme.value.grid },
                    ticks: {
                        color: theme.value.text,
                        font: { size: 11 },
                        callback: (val) => formatAxisTick(val, unit)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: theme.value.text,
                        font: { size: 11 }
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

    // Remove imagens/SVGs em base64 geradas no texto pela IA
    text = text.replace(/!\[[^\]]*\]\(data:image\/[^)]+\)/gi, '')

    // Converte sintaxe Markdown inline
    text = text
        .replace(/`([^`\n]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')

    // Normaliza quebras <br>
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

            // Tabela Markdown
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

                return `<div class="table-wrapper"><table>${thead}${tbody}</table></div>`
            }

            // Títulos Markdown
            if (/^#{1,3}\s+/.test(lines[0])) {
                const level = lines[0].match(/^(#{1,3})/)[1].length
                const tag = level === 1 ? 'h4' : level === 2 ? 'h5' : 'h6'
                const title = lines[0].replace(/^#{1,3}\s+/, '')
                const rest = lines.slice(1).join('<br>')
                return `<${tag}>${title}</${tag}>${rest ? `<p>${rest}</p>` : ''}`
            }

            // Lista não ordenada (•, - ou *)
            if (lines.every((l) => /^[•\-*]\s+/.test(l))) {
                const items = lines
                    .map((l) => `<li>${l.replace(/^[•\-*]\s+/, '')}</li>`)
                    .join('')
                return `<ul>${items}</ul>`
            }

            // Lista ordenada
            if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
                const items = lines
                    .map((l) => `<li>${l.replace(/^\d+[.)]\s+/, '')}</li>`)
                    .join('')
                return `<ol>${items}</ol>`
            }

            // Citação
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
.user-message {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
}

.chart-container {
    position: relative;
    width: 100%;
    min-width: 260px;
}

.rich-content {
    line-height: 1.6;
    word-break: break-word;
}

.rich-content :deep(p) {
    margin: 0 0 0.85em 0;
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
    margin: 0.9em 0;
}

.rich-content :deep(strong),
.rich-content :deep(b) {
    font-weight: 600;
}

.rich-content :deep(h4),
.rich-content :deep(h5),
.rich-content :deep(h6) {
    margin: 0.5em 0 0.45em 0;
    font-weight: 600;
    line-height: 1.35;
}

.rich-content :deep(ul),
.rich-content :deep(ol) {
    margin: 0 0 0.85em 0;
    padding-left: 1.4em;
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
    font-size: 0.88em;
}

.rich-content :deep(blockquote) {
    border-left: 3px solid var(--q-primary);
    margin: 0 0 0.85em 0;
    padding-left: 0.8em;
    opacity: 0.9;
}

.rich-content :deep(.table-wrapper) {
    overflow-x: auto;
    margin: 0.5em 0 0.85em 0;
    border-radius: 6px;
}

.rich-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
}

.rich-content :deep(th),
.rich-content :deep(td) {
    border: 1px solid rgba(0, 0, 0, 0.14);
    padding: 7px 10px;
    text-align: left;
}

.rich-content :deep(th) {
    background-color: rgba(0, 0, 0, 0.05);
    font-weight: 600;
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