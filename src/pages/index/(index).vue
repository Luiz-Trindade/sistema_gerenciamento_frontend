<template>
    <q-page class="q-pa-sm q-pa-md-md">
        <q-inner-loading :showing="isLoading" color="primary" />

        <div v-if="!isError">
            <!-- Cabeçalho -->
            <div class="row items-center q-mb-md">
                <q-icon name="dashboard" color="primary" size="32px" class="q-mr-sm" />
                <div>
                    <div class="text-h6 text-weight-bold">Visão Geral</div>
                    <div class="text-caption">Resumo do desempenho no período selecionado</div>
                </div>
                <q-space />
                <q-btn flat round icon="refresh" color="primary" @click="refetch" :loading="isFetching">
                    <q-tooltip>Atualizar dados</q-tooltip>
                </q-btn>
            </div>

            <!-- Filtros -->
            <div class="row q-col-gutter-sm q-mb-lg">
                <div class="col-12 col-sm-6 col-md-4">
                    <q-select v-model="filterPeriod" :options="periodOptions" label="Período" outlined dense emit-value
                        map-options />
                </div>
                <div class="col-12 col-sm-6 col-md-4">
                    <q-select v-model="filterCategory" :options="categoryOptions" label="Categoria" outlined dense
                        emit-value map-options disable />
                </div>
                <div class="col-12 col-md-4 flex justify-end items-center">
                    <q-btn color="primary" label="Aplicar" icon="filter_alt" class="full-width" @click="applyFilters"
                        :loading="isFetching" />
                </div>
            </div>

            <!-- KPIs -->
            <div class="row q-col-gutter-sm q-md-gutter-md q-mb-lg">
                <div v-for="kpi in mappedKpis" :key="kpi.label" class="col-6 col-md-3">
                    <q-card class="full-height">
                        <q-card-section class="q-pa-sm">
                            <div class="row items-center">
                                <q-icon :name="kpi.icon" :color="kpi.color" size="28px" class="q-mr-sm" />
                                <div class="col" style="min-width: 0;">
                                    <div class="text-caption text-truncate">{{ kpi.label }}</div>
                                    <div class="text-h6 text-weight-bold text-truncate">{{ kpi.value }}</div>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="text-subtitle2 text-weight-bold q-mb-sm">Análises</div>
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                    <q-card class="full-height">
                        <q-card-section>
                            <div class="row items-center q-mb-md">
                                <q-icon name="show_chart" color="positive" size="22px" class="q-mr-sm" />
                                <div class="text-subtitle1 text-weight-bold">Evolução de Vendas</div>
                            </div>
                            <div class="chart-container">
                                <LineChart :data="lineData" :options="lineOptions" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-6">
                    <q-card class="full-height">
                        <q-card-section>
                            <div class="row items-center q-mb-md">
                                <q-icon name="leaderboard" color="primary" size="22px" class="q-mr-sm" />
                                <div class="text-subtitle1 text-weight-bold">Top 5 Produtos</div>
                            </div>
                            <div class="chart-container">
                                <BarChart :data="barData1" :options="barOptions1" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-6">
                    <q-card class="full-height">
                        <q-card-section>
                            <div class="row items-center q-mb-md">
                                <q-icon name="donut_large" color="warning" size="22px" class="q-mr-sm" />
                                <div class="text-subtitle1 text-weight-bold">Meios de Pagamento</div>
                            </div>
                            <div class="chart-container">
                                <DoughnutChart :data="doughnutData" :options="doughnutOptions" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-6">
                    <q-card class="full-height">
                        <q-card-section>
                            <div class="row items-center q-mb-md">
                                <q-icon name="bar_chart" color="secondary" size="22px" class="q-mr-sm" />
                                <div class="text-subtitle1 text-weight-bold">Pedidos por Status</div>
                            </div>
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
                <div class="text-h6">Erro ao carregar dados</div>
                <q-btn color="primary" label="Tentar novamente" class="q-mt-md" @click="refetch" />
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/boot/axios'
import { animateValue } from '@/utils'

import LineChart from '@/components/LineChart.vue'
import BarChart from '@/components/BarChart.vue'
import DoughnutChart from '@/components/DoughnutChart.vue'

const $q = useQuasar()

// --- Filtros ---
const filterPeriod = ref('month')
const filterCategory = ref('all')
const activePeriod = ref('month')

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
    activePeriod.value = filterPeriod.value
}

// --- Datas ---
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
const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: () => ['dashboard', activePeriod.value],
    queryFn: async () => {
        const dates = getDateRange(activePeriod.value)
        const response = await api.get('/dashboards/principal/', { params: dates })
        return response.data
    },
    placeholderData: (previousData) => previousData,
})

// --- Formatação ---
const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))

const formatNumber = (value) =>
    new Intl.NumberFormat('pt-BR').format(Math.round(Number(value || 0)))

// --- KPIs animados ---
const animatedVendas = ref(0)
const animatedTicket = ref(0)
const animatedClientes = ref(0)
const animatedPedidos = ref(0)

watch(
    () => data.value?.kpis,
    (k) => {
        if (!k) return
        animateValue(animatedVendas, Number(k.vendas) || 0)
        animateValue(animatedTicket, Number(k.ticket_medio) || 0)
        animateValue(animatedClientes, Number(k.clientes) || 0)
        animateValue(animatedPedidos, Number(k.pedidos) || 0)
    },
    { immediate: true }
)

const mappedKpis = computed(() => {
    if (!data.value?.kpis) return []

    return [
        { label: 'Vendas', value: formatCurrency(animatedVendas.value), icon: 'trending_up', color: 'positive' },
        { label: 'Ticket Médio', value: formatCurrency(animatedTicket.value), icon: 'receipt_long', color: 'primary' },
        { label: 'Clientes', value: formatNumber(animatedClientes.value), icon: 'people', color: 'info' },
        { label: 'Pedidos', value: formatNumber(animatedPedidos.value), icon: 'shopping_cart', color: 'secondary' }
    ]
})

// --- Dados dos gráficos ---
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

// --- Opções dos gráficos ---
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
.chart-container {
    position: relative;
    height: 260px;
}

@media (min-width: 1024px) {
    .chart-container {
        height: 300px;
    }
}
</style>