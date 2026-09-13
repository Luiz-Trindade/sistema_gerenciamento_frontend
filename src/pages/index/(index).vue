<template>
    <q-page>
        <div class="q-pa-sm q-md-pa-md">
            <!-- Cabeçalho -->
            <div class="row items-center q-mb-md">
                <div class="text-h6 text-sm-h5 text-weight-bold">Visão Geral</div>
                <q-space />
                <q-btn flat round icon="refresh" color="primary" @click="mockRefresh">
                    <q-tooltip>Atualizar dados</q-tooltip>
                </q-btn>
            </div>

            <!-- KPIs -->
            <div class="row q-col-gutter-sm q-md-gutter-md q-mb-md">
                <div v-for="kpi in kpis" :key="kpi.label" class="col-6 col-md-3">
                    <q-card class="no-shadow kpi-card">
                        <q-card-section class="q-pa-sm">
                            <div class="row items-center">
                                <q-icon :name="kpi.icon" :color="kpi.color" size="28px" class="q-mr-sm" />
                                <div class="col">
                                    <div class="text-caption text-grey-7">{{ kpi.label }}</div>
                                    <div class="text-h6 text-weight-bold text-no-wrap" :class="`text-${kpi.color}`">
                                        {{ kpi.value }}
                                    </div>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="row q-col-gutter-md">
                <div class="col-12 col-lg-8">
                    <q-card class="no-shadow chart-card">
                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Evolução de Vendas (6 meses)</div>
                            <LineChart :data="lineData" :options="lineOptions" />
                        </q-card-section>
                    </q-card>
                </div>
                <div class="col-12 col-lg-4">
                    <q-card class="no-shadow chart-card">
                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Meios de Pagamento</div>
                            <DoughnutChart :data="doughnutData" :options="doughnutOptions" />
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import LineChart from '@/components/LineChart.vue'
import DoughnutChart from '@/components/DoughnutChart.vue'

const $q = useQuasar()

const theme = computed(() => ({
    text: $q.dark.isActive ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    grid: $q.dark.isActive ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    tooltipBg: $q.dark.isActive ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
    tooltipText: $q.dark.isActive ? '#fff' : '#333'
}))

const kpis = ref([
    { label: 'Vendas (Mês)', value: 'R$ 19.500', icon: 'trending_up', color: 'positive' },
    { label: 'A Receber', value: 'R$ 4.200', icon: 'account_balance_wallet', color: 'negative' },
    { label: 'Clientes', value: '142', icon: 'people', color: 'info' },
    { label: 'Estoque Baixo', value: '8 itens', icon: 'warning', color: 'warning' }
])

const lineData = ref({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [{ label: 'Receita (R$)', data: [12500, 15000, 11000, 18000, 22000, 19500], borderColor: '#4FC08D', backgroundColor: 'rgba(79, 192, 141, 0.15)', fill: true, tension: 0.4 }]
})

const lineOptions = computed(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: theme.value.tooltipBg, titleColor: theme.value.tooltipText, bodyColor: theme.value.tooltipText, callbacks: { label: c => `R$ ${c.parsed.y.toLocaleString('pt-BR')}` } } },
    scales: { y: { beginAtZero: true, grid: { color: theme.value.grid }, ticks: { color: theme.value.text, callback: v => `R$ ${v / 1000}k` } }, x: { grid: { display: false }, ticks: { color: theme.value.text } } }
}))

const doughnutData = ref({
    labels: ['Pix', 'Cartão Crédito', 'Boleto', 'Dinheiro'],
    datasets: [{ data: [45, 30, 15, 10], backgroundColor: ['#4FC08D', '#1976D2', '#F2C037', '#E53935'], borderWidth: 0, hoverOffset: 4 }]
})

const doughnutOptions = computed(() => ({
    responsive: true, maintainAspectRatio: false, cutout: '60%',
    plugins: {
        legend: { position: 'bottom', labels: { color: theme.value.text, boxWidth: 12, padding: 15, font: { size: 11 } } },
        tooltip: { backgroundColor: theme.value.tooltipBg, titleColor: theme.value.tooltipText, bodyColor: theme.value.tooltipText, callbacks: { label: c => ` ${c.label}: ${c.parsed}%` } }
    }
}))

const mockRefresh = () => $q.notify({ message: 'Dados atualizados!', color: 'positive', icon: 'check', position: 'top' })
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
</style>