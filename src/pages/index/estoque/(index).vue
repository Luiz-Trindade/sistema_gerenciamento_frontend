<template>
    <q-page>
        <div class="q-pa-md">

            <!-- Breadcrumbs -->
            <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
                <q-breadcrumbs-el label="Início" icon="home" to="/" />
                <q-breadcrumbs-el label="Estoque" icon="inventory_2" />
            </q-breadcrumbs>

            <!-- Cabeçalho -->
            <div class="row items-center q-mb-lg">
                <q-icon name="inventory_2" color="primary" size="32px" class="q-mr-sm" />
                <div>
                    <div class="text-h6 text-weight-bold">Estoque</div>
                    <div class="text-caption">Escolha o módulo que deseja gerenciar</div>
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
                    <div class="text-h6">Erro ao carregar dados do estoque</div>
                    <q-btn color="primary" label="Tentar novamente" class="q-mt-md" @click="refetch" />
                </div>
            </div>

            <div v-else>
                <!-- KPIs -->
                <div class="row q-col-gutter-sm q-md-gutter-md q-mb-lg">
                    <div v-for="kpi in mappedKpis" :key="kpi.label" class="col-6 col-md-3">
                        <q-card class="full-height" :class="{ 'cursor-pointer': kpi.to }"
                            @click="kpi.to && $router.push(kpi.to)">
                            <q-card-section class="q-pa-sm">
                                <div class="row items-center">
                                    <q-icon :name="kpi.icon" :color="kpi.color" size="28px" class="q-mr-sm" />
                                    <div class="col" style="min-width: 0;">
                                        <div class="text-caption text-truncate">{{ kpi.label }}</div>
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
                        <q-card class="full-height">
                            <q-card-section>
                                <div class="row items-center q-mb-sm">
                                    <q-icon name="notification_important" color="warning" size="22px" class="q-mr-sm" />
                                    <div class="text-subtitle1 text-weight-bold">Atenção necessária</div>
                                </div>

                                <q-skeleton v-if="isLoading" type="rect" height="120px" />

                                <div v-else-if="!hasAlertas" class="text-center q-pa-md">
                                    <q-icon name="check_circle" color="positive" size="32px" class="q-mb-sm" />
                                    <div class="text-caption">Tudo em ordem por aqui.</div>
                                </div>

                                <q-list v-else separator>
                                    <q-item v-if="alertas.abaixo_minimo.length" clickable
                                        @click="$router.push('/estoque/produtos?filtro=abaixo_minimo')">
                                        <q-item-section avatar>
                                            <q-icon name="warning" color="warning" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label class="text-weight-medium"
                                                :class="mov.tipo === 'entrada' ? 'text-green' : 'text-red'">
                                                {{ kpis.abaixo_minimo }} produto(s) abaixo do mínimo
                                            </q-item-label>
                                            <q-item-label class="text-caption">
                                                {{ nomesResumo(alertas.abaixo_minimo) }}
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-icon name="chevron_right" class="text-caption" />
                                        </q-item-section>
                                    </q-item>

                                    <q-item v-if="alertas.zerados.length" clickable
                                        @click="$router.push('/estoque/produtos?filtro=zerados')">
                                        <q-item-section avatar>
                                            <q-icon name="remove_shopping_cart" color="negative" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label class="text-weight-medium">
                                                {{ kpis.zerados }} produto(s) zerado(s)
                                            </q-item-label>
                                            <q-item-label class="text-caption">
                                                {{ nomesResumo(alertas.zerados) }}
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-icon name="chevron_right" class="text-caption" />
                                        </q-item-section>
                                    </q-item>

                                    <q-item v-if="alertas.sem_movimentacao.length" clickable
                                        @click="$router.push('/estoque/produtos?filtro=sem_movimentacao')">
                                        <q-item-section avatar>
                                            <q-icon name="schedule" color="info" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label class="text-weight-medium">
                                                {{ alertas.sem_movimentacao.length }} produto(s) sem movimentação
                                                recente
                                            </q-item-label>
                                            <q-item-label class="text-caption">
                                                {{ nomesResumo(alertas.sem_movimentacao) }}
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-icon name="chevron_right" class="text-caption" />
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-card-section>
                        </q-card>
                    </div>

                    <!-- Atividades recentes -->
                    <div class="col-12 col-md-5">
                        <q-card class="full-height">
                            <q-card-section>
                                <div class="row items-center q-mb-sm">
                                    <q-icon name="history" color="primary" size="22px" class="q-mr-sm" />
                                    <div class="text-subtitle1 text-weight-bold">Atividades recentes</div>
                                    <q-space />
                                    <q-btn flat dense size="sm" color="primary" label="Ver todas"
                                        @click="$router.push('/estoque/movimentacoes')" />
                                </div>

                                <q-skeleton v-if="isLoading" type="rect" height="160px" />

                                <div v-else-if="!atividades.length" class="text-center q-pa-md">
                                    <q-icon name="inbox" size="32px" class="q-mb-sm text-caption" />
                                    <div class="text-caption">Nenhuma movimentação registrada ainda.</div>
                                </div>

                                <q-list v-else dense separator>
                                    <q-item v-for="mov in atividades" :key="mov.id">
                                        <q-item-section avatar>
                                            <q-icon :name="mov.tipo === 'entrada' ? 'arrow_upward' : 'arrow_downward'"
                                                :color="mov.tipo === 'entrada' ? 'positive' : 'negative'" size="20px" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label class="text-body2 ellipsis">{{ mov.produto }}</q-item-label>
                                            <q-item-label class="text-weight-light ellipsis">
                                                {{ mov.observacao || mov.tipo_display }}
                                            </q-item-label>
                                        </q-item-section>

                                        <q-item-section side top>
                                            <q-item-label class="text-weight-medium"
                                                :class="mov.tipo === 'entrada' ? 'text-green' : 'text-red'">
                                                {{ mov.tipo === 'entrada' ? '+' : '-' }}{{ mov.quantidade }}
                                            </q-item-label>
                                            <q-item-label class="text-caption text-primary">
                                                {{ tempoRelativo(mov.criado_em) }}
                                            </q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </q-list>
                            </q-card-section>
                        </q-card>
                    </div>
                </div>

                <!-- Módulos -->
                <div class="text-subtitle2 text-weight-bold q-mb-sm">Módulos</div>
                <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                        <q-card class="cursor-pointer non-selectable full-height" tabindex="0" role="link"
                            @click="navigateTo('produtos')" @keydown.enter="navigateTo('produtos')">
                            <q-card-section class="text-center q-pa-lg">
                                <q-icon name="category" color="primary" size="64px" class="q-mb-md" />
                                <div class="text-h6 text-weight-bold q-mb-xs">Produtos</div>
                                <div class="text-caption">Cadastrar, editar e visualizar o catálogo de itens</div>
                                <q-badge v-if="!isLoading" color="primary" outline class="q-mt-sm">
                                    {{ formatNumber(kpis.total_produtos) }} itens
                                </q-badge>
                            </q-card-section>
                            <q-card-section class="q-pt-none">
                                <div class="row items-center justify-center text-primary">
                                    <span class="text-caption text-weight-medium">Acessar</span>
                                    <q-icon name="arrow_forward_ios" size="12px" class="q-ml-xs" />
                                </div>
                            </q-card-section>
                        </q-card>
                    </div>

                    <div class="col-12 col-sm-6">
                        <q-card class="cursor-pointer non-selectable full-height" tabindex="0" role="link"
                            @click="navigateTo('movimentacoes')" @keydown.enter="navigateTo('movimentacoes')">
                            <q-card-section class="text-center q-pa-lg">
                                <q-icon name="swap_horiz" color="orange" size="64px" class="q-mb-md" />
                                <div class="text-h6 text-weight-bold q-mb-xs">Movimentações</div>
                                <div class="text-caption">Registrar entradas, saídas e ajustar saldos</div>
                                <q-badge v-if="!isLoading" color="orange" outline class="q-mt-sm">
                                    {{ formatNumber(kpis.movimentacoes) }} no período
                                </q-badge>
                            </q-card-section>
                            <q-card-section class="q-pt-none">
                                <div class="row items-center justify-center text-orange">
                                    <span class="text-caption text-weight-medium">Acessar</span>
                                    <q-icon name="arrow_forward_ios" size="12px" class="q-ml-xs" />
                                </div>
                            </q-card-section>
                        </q-card>
                    </div>
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

// --- Atalhos reativos ---
const kpis = computed(() => data.value?.kpis ?? {})
const alertas = computed(() => data.value?.alertas ?? {
    abaixo_minimo: [],
    zerados: [],
    sem_movimentacao: [],
})
const atividades = computed(() => data.value?.atividades_recentes ?? [])

const hasAlertas = computed(() =>
    alertas.value.abaixo_minimo.length ||
    alertas.value.zerados.length ||
    alertas.value.sem_movimentacao.length
)

// --- Formatação ---
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
    const nomes = lista.slice(0, 3).map(p => p.nome).join(', ')
    const resto = lista.length - 3
    return resto > 0 ? `${nomes} e mais ${resto}` : nomes
}

// --- KPIs animados ---
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
    },
    {
        label: 'Produtos ativos',
        value: formatNumber(animatedTotalProdutos.value),
        icon: 'category',
        color: 'info',
        to: '/estoque/produtos',
    },
    {
        label: 'Abaixo do mínimo',
        value: formatNumber(animatedAbaixoMinimo.value),
        icon: 'warning',
        color: kpis.value.abaixo_minimo > 0 ? 'warning' : 'positive',
        badge: kpis.value.abaixo_minimo > 0 ? kpis.value.abaixo_minimo : null,
        to: '/estoque/produtos?filtro=abaixo_minimo',
    },
    {
        label: 'Movimentações',
        value: formatNumber(animatedMovimentacoes.value),
        icon: 'swap_horiz',
        color: 'secondary',
        to: '/estoque/movimentacoes',
    },
])
</script>