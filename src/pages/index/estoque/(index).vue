<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Estoque" icon="inventory_2" />
        </q-breadcrumbs>

        <!-- Cabeçalho -->
        <div class="row items-center q-mb-lg col-gutter-sm">
            <q-icon name="inventory_2" color="primary" size="32px" class="q-mr-sm" />
            <div>
                <div class="text-h5 text-weight-bold">Estoque</div>
                <div class="text-caption text-grey-7">Gerencie produtos, saldos e movimentações de entrada e saída</div>
            </div>
            <q-space />
            <q-btn flat round icon="refresh" color="primary" @click="refetch" :loading="isFetching">
                <q-tooltip>Atualizar dados</q-tooltip>
            </q-btn>
        </div>

        <!-- Estado de Erro -->
        <div v-if="isError" class="flex flex-center q-pa-xl">
            <div class="text-center">
                <q-icon name="error_outline" size="48px" color="negative" class="q-mb-md" />
                <div class="text-h6 text-weight-bold">Erro ao carregar dados do estoque</div>
                <div class="text-caption text-grey-7 q-mb-md">Não foi possível obter o resumo do estoque. Tente
                    novamente.</div>
                <q-btn color="primary" icon="refresh" label="Tentar novamente" no-caps @click="refetch" />
            </div>
        </div>

        <div v-else>
            <!-- KPIs -->
            <div class="row q-col-gutter-sm q-md-gutter-md q-mb-lg">
                <div v-for="kpi in mappedKpis" :key="kpi.label" class="col-6 col-md-3">
                    <q-card class="full-height no-shadow" bordered :class="{ 'cursor-pointer': kpi.to }"
                        :style="kpi.style" @click="kpi.to && $router.push(kpi.to)">
                        <q-card-section class="q-pa-sm q-pa-md-sm">
                            <div class="row items-center">
                                <q-icon :name="kpi.icon" :color="kpi.color" size="28px" class="q-mr-sm" />
                                <div class="col" style="min-width: 0;">
                                    <div class="text-caption text-grey-7 text-truncate">{{ kpi.label }}</div>
                                    <div class="text-h6 text-weight-bold text-truncate">
                                        <q-skeleton v-if="isLoading" type="text" width="60px" />
                                        <template v-else>{{ kpi.value }}</template>
                                    </div>
                                </div>
                                <q-badge v-if="kpi.badge" :color="kpi.color" floating>{{ kpi.badge }}</q-badge>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <!-- Alertas + Atividades -->
            <div class="row q-col-gutter-md q-mb-lg">
                <!-- Alertas -->
                <div class="col-12 col-md-7">
                    <q-card class="full-height no-shadow" bordered>
                        <q-card-section>
                            <div class="row items-center q-mb-sm">
                                <q-icon name="notification_important" color="warning" size="22px" class="q-mr-sm" />
                                <div class="text-subtitle1 text-weight-bold">Atenção necessária</div>
                            </div>

                            <q-skeleton v-if="isLoading" type="rect" height="120px" />

                            <div v-else-if="!hasAlertas" class="text-center q-pa-lg">
                                <q-icon name="check_circle" color="positive" size="36px" class="q-mb-xs" />
                                <div class="text-subtitle2 text-weight-bold">Tudo em ordem por aqui!</div>
                                <div class="text-caption text-grey-7">Nenhum produto zerado ou abaixo do mínimo.</div>
                            </div>

                            <q-list v-else separator class="rounded-borders">
                                <q-item v-if="alertas.abaixo_minimo.length" clickable
                                    @click="$router.push('/estoque/produtos?filtro=abaixo_minimo')">
                                    <q-item-section avatar>
                                        <q-icon name="warning" color="warning" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label class="text-weight-medium text-warning">
                                            {{ kpis.abaixo_minimo }} produto(s) abaixo do mínimo
                                        </q-item-label>
                                        <q-item-label class="text-caption text-grey-7">
                                            {{ nomesResumo(alertas.abaixo_minimo) }}
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-icon name="chevron_right" />
                                    </q-item-section>
                                </q-item>

                                <q-item v-if="alertas.zerados.length" clickable
                                    @click="$router.push('/estoque/produtos?filtro=zerados')">
                                    <q-item-section avatar>
                                        <q-icon name="remove_shopping_cart" color="negative" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label class="text-weight-medium text-negative">
                                            {{ kpis.zerados }} produto(s) com estoque zerado
                                        </q-item-label>
                                        <q-item-label class="text-caption text-grey-7">
                                            {{ nomesResumo(alertas.zerados) }}
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-icon name="chevron_right" />
                                    </q-item-section>
                                </q-item>

                                <q-item v-if="alertas.sem_movimentacao.length" clickable
                                    @click="$router.push('/estoque/produtos?filtro=sem_movimentacao')">
                                    <q-item-section avatar>
                                        <q-icon name="schedule" color="info" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label class="text-weight-medium">
                                            {{ alertas.sem_movimentacao.length }} produto(s) sem movimentação recente
                                        </q-item-label>
                                        <q-item-label class="text-caption text-grey-7">
                                            {{ nomesResumo(alertas.sem_movimentacao) }}
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <q-icon name="chevron_right" />
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card-section>
                    </q-card>
                </div>

                <!-- Atividades recentes -->
                <div class="col-12 col-md-5">
                    <q-card class="full-height no-shadow" bordered>
                        <q-card-section>
                            <div class="row items-center q-mb-sm">
                                <q-icon name="history" color="primary" size="22px" class="q-mr-sm" />
                                <div class="text-subtitle1 text-weight-bold">Atividades recentes</div>
                                <q-space />
                                <q-btn flat dense size="sm" color="primary" label="Ver todas" no-caps
                                    @click="$router.push('/estoque/movimentacoes')" />
                            </div>

                            <q-skeleton v-if="isLoading" type="rect" height="160px" />

                            <div v-else-if="!atividades.length" class="text-center q-pa-lg">
                                <q-icon name="inbox" size="36px" color="grey-5" class="q-mb-xs" />
                                <div class="text-caption text-grey-7">Nenhuma movimentação registrada recentemente.
                                </div>
                            </div>

                            <q-list v-else dense separator class="rounded-borders">
                                <q-item v-for="mov in atividades" :key="mov.id">
                                    <q-item-section avatar>
                                        <q-icon :name="mov.tipo === 'entrada' ? 'arrow_downward' : 'arrow_upward'"
                                            :color="mov.tipo === 'entrada' ? 'positive' : 'negative'" size="20px" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label class="text-body2 text-weight-medium ellipsis">
                                            {{ mov.produto }}
                                        </q-item-label>
                                        <q-item-label class="text-caption text-grey-7 ellipsis">
                                            {{ mov.observacao || mov.tipo_display || (mov.tipo === 'entrada' ? 'Entrada'
                                            : 'Saída')
                                            }}
                                        </q-item-label>
                                    </q-item-section>

                                    <q-item-section side top>
                                        <q-item-label class="text-weight-bold"
                                            :class="mov.tipo === 'entrada' ? 'text-positive' : 'text-negative'">
                                            {{ mov.tipo === 'entrada' ? '+' : '-' }}{{ mov.quantidade }}
                                        </q-item-label>
                                        <q-item-label class="text-caption text-grey-6">
                                            {{ tempoRelativo(mov.criado_em) }}
                                        </q-item-label>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <!-- Módulos de Acesso Rápido -->
            <div class="text-subtitle2 text-weight-bold q-mb-sm text-grey-8">Módulos do Estoque</div>
            <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                    <q-card class="cursor-pointer non-selectable full-height no-shadow module-card" bordered
                        tabindex="0" role="link" @click="navigateTo('produtos')"
                        @keydown.enter="navigateTo('produtos')">
                        <q-card-section class="text-center q-pa-lg">
                            <q-icon name="category" color="primary" size="56px" class="q-mb-sm" />
                            <div class="text-h6 text-weight-bold q-mb-xs">Produtos</div>
                            <div class="text-caption text-grey-7">Cadastrar, editar e acompanhar o catálogo de produtos
                            </div>
                            <q-badge v-if="!isLoading" color="primary" outline class="q-mt-md q-px-sm q-py-xs">
                                {{ formatNumber(kpis.total_produtos) }} produtos cadastrados
                            </q-badge>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <div class="row items-center justify-center text-primary">
                                <span class="text-caption text-weight-bold">Acessar Catálogo</span>
                                <q-icon name="arrow_forward_ios" size="12px" class="q-ml-xs" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-sm-6">
                    <q-card class="cursor-pointer non-selectable full-height no-shadow module-card" bordered
                        tabindex="0" role="link" @click="navigateTo('movimentacoes')"
                        @keydown.enter="navigateTo('movimentacoes')">
                        <q-card-section class="text-center q-pa-lg">
                            <q-icon name="swap_horiz" color="amber-9" size="56px" class="q-mb-sm" />
                            <div class="text-h6 text-weight-bold q-mb-xs">Movimentações</div>
                            <div class="text-caption text-grey-7">Registrar entradas, saídas e justificativas de estoque
                            </div>
                            <q-badge v-if="!isLoading" color="amber-9" outline class="q-mt-md q-px-sm q-py-xs">
                                {{ formatNumber(kpis.movimentacoes) }} registros no período
                            </q-badge>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <div class="row items-center justify-center text-amber-9">
                                <span class="text-caption text-weight-bold">Ver Histórico</span>
                                <q-icon name="arrow_forward_ios" size="12px" class="q-ml-xs" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/boot/axios'
import { animateValue } from '@/utils'

const router = useRouter()

const navigateTo = (modulo) => {
    router.push(`/estoque/${modulo}`)
}

// --- Vue Query ---
const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['estoque', 'resumo'],
    queryFn: async () => {
        const response = await api.get('/dashboards/estoque/')
        return response.data
    },
    placeholderData: (previous) => previous,
})

const kpis = computed(() => data.value?.kpis ?? {})
const alertas = computed(() => data.value?.alertas ?? {
    abaixo_minimo: [],
    zerados: [],
    sem_movimentacao: [],
})
const atividades = computed(() => data.value?.atividades_recentes ?? [])

const hasAlertas = computed(() =>
    (alertas.value.abaixo_minimo?.length || 0) > 0 ||
    (alertas.value.zerados?.length || 0) > 0 ||
    (alertas.value.sem_movimentacao?.length || 0) > 0
)

const formatCurrency = (value) => {
    if (value === undefined || value === null || value === '') return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

const formatNumber = (value) => {
    if (value === undefined || value === null || value === '') return '0'
    return new Intl.NumberFormat('pt-BR').format(Math.round(Number(value)))
}

const tempoRelativo = (iso) => {
    if (!iso) return ''
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`
    if (diff < 604800) return `${Math.floor(diff / 86400)} d`
    return new Date(iso).toLocaleDateString('pt-BR')
}

const nomesResumo = (lista) => {
    if (!lista || !lista.length) return ''
    const nomes = lista.slice(0, 3).map(p => p.nome).join(', ')
    const resto = lista.length - 3
    return resto > 0 ? `${nomes} e mais ${resto}` : nomes
}

// KPIs animados
const animatedValorEstoque = ref(0)
const animatedTotalProdutos = ref(0)
const animatedAbaixoMinimo = ref(0)
const animatedMovimentacoes = ref(0)

watch(
    () => data.value?.kpis,
    (k) => {
        if (!k) return
        animateValue(animatedValorEstoque, Number(k.valor_estoque) || 0)
        animateValue(animatedTotalProdutos, Number(k.total_produtos) || 0)
        animateValue(animatedAbaixoMinimo, Number(k.abaixo_minimo) || 0)
        animateValue(animatedMovimentacoes, Number(k.movimentacoes) || 0)
    },
    { immediate: true }
)

const mappedKpis = computed(() => [
    {
        label: 'Valor em estoque',
        value: formatCurrency(animatedValorEstoque.value),
        icon: 'payments',
        color: 'primary',
        style: { borderLeft: '4px solid #1976D2' },
    },
    {
        label: 'Produtos ativos',
        value: formatNumber(animatedTotalProdutos.value),
        icon: 'category',
        color: 'info',
        style: { borderLeft: '4px solid #31CCEC' },
        to: '/estoque/produtos',
    },
    {
        label: 'Abaixo do mínimo',
        value: formatNumber(animatedAbaixoMinimo.value),
        icon: 'warning',
        color: kpis.value.abaixo_minimo > 0 ? 'warning' : 'positive',
        style: { borderLeft: `4px solid ${kpis.value.abaixo_minimo > 0 ? '#F2C037' : '#21BA45'}` },
        badge: kpis.value.abaixo_minimo > 0 ? kpis.value.abaixo_minimo : null,
        to: '/estoque/produtos?filtro=abaixo_minimo',
    },
    {
        label: 'Movimentações',
        value: formatNumber(animatedMovimentacoes.value),
        icon: 'swap_horiz',
        color: 'secondary',
        style: { borderLeft: '4px solid #26A69A' },
        to: '/estoque/movimentacoes',
    },
])
</script>

<style scoped>
.module-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.module-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}
</style>