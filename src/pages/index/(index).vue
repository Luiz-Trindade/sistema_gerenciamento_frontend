<template>
    <q-page class="q-pa-sm q-pa-md-md">
        <!-- isLoading: carregamento inicial, isFetching: carregamento em background (ex: ao mudar filtro) -->
        <q-inner-loading :showing="isLoading" color="primary" />

        <div v-if="!isError">
            <!-- Cabeçalho -->
            <div class="row items-center q-mb-md">
                <div class="text-h6 text-sm-h5 text-weight-bold">Visão Geral</div>
                <q-space />
                <!-- isFetching mostra o loading no botão durante refetchs em background -->
                <q-btn flat round icon="refresh" color="primary" @click="refetch" :loading="isFetching">
                    <q-tooltip>Atualizar dados</q-tooltip>
                </q-btn>
            </div>

            <!-- Filtros -->
            <div class="row q-col-gutter-sm q-mb-md">
                <div class="col-12 col-sm-6 col-md-4">
                    <q-select v-model="filterPeriod" :options="periodOptions" label="Período" outlined dense emit-value
                        map-options />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                    <q-select v-model="filterCategory" :options="categoryOptions" label="Categoria" outlined dense
                        emit-value map-options disable />
                </div>
                <div class="col-12 col-md-4 flex justify-end items-center">
                    <!-- Ao clicar, atualiza o activePeriod, o que dispara o vue-query automaticamente -->
                    <q-btn color="primary" label="Aplicar" icon="filter_alt" class="full-width" @click="applyFilters"
                        :loading="isFetching" />
                </div>
            </div>

            <!-- KPIs -->
            <div class="row q-col-gutter-sm q-md-gutter-md q-mb-md">
                <div v-for="kpi in mappedKpis" :key="kpi.label" class="col-6 col-md-3">
                    <q-card class="no-shadow kpi-card">
                        <q-card-section class="q-pa-sm">
                            <div class="row items-center">
                                <q-icon :name="kpi.icon" :color="kpi.color" size="28px" class="q-mr-sm" />
                                <div class="col" style="min-width: 0;">
                                    <div class="text-caption text-grey-7 text-truncate">{{ kpi.label }}</div>
                                    <div class="text-h6 text-weight-bold text-truncate" :class="`text-${kpi.color}`">
                                        {{ kpi.value }}
                                    </div>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <!-- Gráficos (Grid 2x2) -->
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                    <q-card class="no-shadow chart-card">
                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Evolução de Vendas</div>
                            <div class="chart-container">
                                <LineChart :data="lineData" :options="lineOptions" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-6">
                    <q-card class="no-shadow chart-card">
                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Top 5 Produtos</div>
                            <div class="chart-container">
                                <BarChart :data="barData1" :options="barOptions1" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-6">
                    <q-card class="no-shadow chart-card">
                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Meios de Pagamento</div>
                            <div class="chart-container">
                                <DoughnutChart :data="doughnutData" :options="doughnutOptions" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-6">
                    <q-card class="no-shadow chart-card">
                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Pedidos por Status</div>
                            <div class="chart-container">
                                <BarChart :data="barData2" :options="barOptions2" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <!-- Estado de Erro -->
        <div v-else class="flex flex-center q-pa-xl">
            <div class="text-center">
                <q-icon name="error_outline" size="48px" color="negative" class="q-mb-md" />
                <div class="text-h6 text-negative">Erro ao carregar dados</div>
                <q-btn color="primary" label="Tentar novamente" class="q-mt-md" @click="refetch" />
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useQuery } from '@tanstack/vue-query' // <-- Import do Vue Query
import { api } from '@/boot/axios'

import LineChart from '@/components/LineChart.vue'
import BarChart from '@/components/BarChart.vue'
import DoughnutChart from '@/components/DoughnutChart.vue'

const $q = useQuasar()

// --- Filtros ---
const filterPeriod = ref('month')
const filterCategory = ref('all')
const activePeriod = ref('month') // Controla quando a query deve ser executada

const periodOptions = [
    { label: 'Hoje', value: 'today' },
    { label: 'Últimos 7 dias', value: '7days' },
    { label: 'Este mês', value: 'month' },
    { label: 'Últimos 30 dias', value: '30days' },
    { label: 'Este ano', value: 'year' }
]

const categoryOptions = [
    { label: 'Todas', value: 'all' },
    { label: 'Eletrônicos', value: 'electronics' },
    { label: 'Vestuário', value: 'clothing' },
    { label: 'Acessórios', value: 'accessories' }
]

const applyFilters = () => {
    // Ao alterar esta ref, o vue-query detecta a mudança no queryKey e faz o fetch automaticamente
    activePeriod.value = filterPeriod.value
}

// --- Lógica de Datas ---
const getDateRange = (period) => {
    const end = new Date()
    const start = new Date()

    switch (period) {
        case 'today': break
        case '7days': start.setDate(end.getDate() - 7); break
        case 'month': start.setDate(1); break
        case '30days': start.setDate(end.getDate() - 30); break
        case 'year': start.setMonth(0, 1); break
    }

    const fmt = (d) => d.toISOString().split('T')[0]
    return { start_date: fmt(start), end_date: fmt(end) }
}

// --- Vue Query ---
const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch
} = useQuery({
    // queryKey como função garante reatividade quando activePeriod muda
    queryKey: () => ['dashboard', activePeriod.value],
    queryFn: async () => {
        const dates = getDateRange(activePeriod.value)
        const response = await api.get('/dashboards/principal/', { params: dates })
        return response.data
    },
    // Opcional: manter dados antigos na tela enquanto carrega os novos (evita flicker)
    placeholderData: (previousData) => previousData,
})

// --- Formatação ---
const formatCurrency = (value) => {
    if (value === undefined || value === null || value === '') return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

const formatNumber = (value) => {
    if (value === undefined || value === null || value === '') return '0'
    return new Intl.NumberFormat('pt-BR').format(Number(value))
}

// --- Mapeamento para o Template (Agora usando `data.value` do vue-query) ---
const mappedKpis = computed(() => {
    const k = data.value?.kpis
    if (!k) return []

    return [
        { label: 'Vendas', value: formatCurrency(k.vendas), icon: 'trending_up', color: 'positive' },
        { label: 'Ticket Médio', value: formatCurrency(k.ticket_medio), icon: 'receipt_long', color: 'primary' },
        { label: 'Clientes', value: formatNumber(k.clientes), icon: 'people', color: 'info' },
        { label: 'Pedidos', value: formatNumber(k.pedidos), icon: 'shopping_cart', color: 'secondary' }
    ]
})

const lineData = computed(() => {
    const chart = data.value?.charts?.evolucao_vendas
    if (!chart) return { labels: [], datasets: [] }
    return {
        labels: chart.labels || [],
        datasets: [{
            label: 'Receita',
            data: chart.data || [],
            borderColor: '#4FC08D',
            backgroundColor: 'rgba(79, 192, 141, 0.15)',
            fill: true,
            tension: 0.4
        }]
    }
})

const barData1 = computed(() => {
    const chart = data.value?.charts?.top_produtos
    if (!chart) return { labels: [], datasets: [] }
    return {
        labels: chart.labels || [],
        datasets: [{
            label: 'Vendas',
            data: chart.data || [],
            backgroundColor: '#1976D2',
            borderRadius: 6
        }]
    }
})

const doughnutData = computed(() => {
    const chart = data.value?.charts?.meios_pagamento
    if (!chart) return { labels: [], datasets: [] }
    const colors = ['#4FC08D', '#1976D2', '#F2C037', '#E53935', '#9C27B0', '#607D8B']
    return {
        labels: chart.labels || [],
        datasets: [{
            data: chart.data || [],
            backgroundColor: colors.slice(0, (chart.labels || []).length),
            borderWidth: 0,
            hoverOffset: 4
        }]
    }
})

const barData2 = computed(() => {
    const chart = data.value?.charts?.pedidos_por_status
    if (!chart) return { labels: [], datasets: [] }
    const colors = {
        'Concluído': '#4FC08D',
        'Processando': '#1976D2',
        'Criado': '#F2C037',
        'Cancelado': '#E53935'
    }
    return {
        labels: chart.labels || [],
        datasets: [{
            label: 'Pedidos',
            data: chart.data || [],
            backgroundColor: (chart.labels || []).map(l => colors[l] || '#9E9E9E'),
            borderRadius: 6
        }]
    }
})

// --- Opções dos Gráficos ---
const theme = computed(() => ({
    text: $q.dark.isActive ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    grid: $q.dark.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    tooltipBg: $q.dark.isActive ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
    tooltipText: $q.dark.isActive ? '#fff' : '#333'
}))

const baseOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: theme.value.tooltipBg,
            titleColor: theme.value.tooltipText,
            bodyColor: theme.value.tooltipText
        }
    },
    scales: {
        y: { beginAtZero: true, grid: { color: theme.value.grid }, ticks: { color: theme.value.text } },
        x: { grid: { display: false }, ticks: { color: theme.value.text } }
    }
}))

const lineOptions = computed(() => ({ ...baseOptions.value }))
const barOptions1 = computed(() => ({ ...baseOptions.value, indexAxis: 'y' }))
const barOptions2 = computed(() => ({ ...baseOptions.value }))

const doughnutOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
        legend: {
            position: 'bottom',
            labels: { color: theme.value.text, boxWidth: 12, padding: 15, font: { size: 11 } }
        },
        tooltip: {
            backgroundColor: theme.value.tooltipBg,
            titleColor: theme.value.tooltipText,
            bodyColor: theme.value.tooltipText,
            callbacks: { label: c => ` ${c.label}: ${c.parsed}` }
        }
    }
}))
</script>

<style scoped>
.kpi-card,
.chart-card {
    border: 1px solid rgba(0, 0, 0, 0.04);
    height: 100%;
    transition: all 0.2s ease;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
}

.kpi-card:active {
    transform: scale(0.98);
}

.body--dark .kpi-card,
.body--dark .chart-card {
    border-color: rgba(255, 255, 255, 0.08);
}

.chart-container {
    position: relative;
    height: 240px;
}

@media (min-width: 600px) {
    .chart-container {
        height: 280px;
    }
}

@media (min-width: 1024px) {
    .chart-container {
        height: 320px;
    }
}
</style>