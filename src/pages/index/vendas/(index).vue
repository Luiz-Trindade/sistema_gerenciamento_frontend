<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Vendas" icon="point_of_sale" />
        </q-breadcrumbs>

        <!-- Cabeçalho -->
        <div class="row items-center q-mb-lg col-gutter-sm">
            <q-icon name="point_of_sale" color="primary" size="32px" class="q-mr-sm" />
            <div>
                <div class="text-h5 text-weight-bold">Vendas</div>
                <div class="text-caption text-grey-7">Visão geral de faturamento, pedidos e recebimentos</div>
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
                <div class="text-h6 text-weight-bold">Erro ao carregar dados de vendas</div>
                <div class="text-caption text-grey-7 q-mb-md">Não foi possível obter o resumo do faturamento. Tente
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
                                <div class="text-caption text-grey-7">Nenhuma conta vencida ou pendência crítica.</div>
                            </div>

                            <q-list v-else separator class="rounded-borders">
                                <q-item v-for="a in alertasAtivos" :key="a.key" clickable @click="$router.push(a.to)">
                                    <q-item-section avatar>
                                        <q-icon :name="a.icon" :color="a.color" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label class="text-weight-medium">{{ a.titulo }}</q-item-label>
                                        <q-item-label class="text-caption text-grey-7">{{ a.resumo }}</q-item-label>
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
                        <q-card-section class="q-pb-none">
                            <div class="row items-center q-mb-sm">
                                <q-icon name="history" color="primary" size="22px" class="q-mr-sm" />
                                <div class="text-subtitle1 text-weight-bold">Atividades recentes</div>
                                <q-space />
                                <q-btn flat dense size="sm" color="primary" label="Ver todas" no-caps
                                    @click="$router.push('/vendas/pedidos')" />
                            </div>

                            <q-tabs v-model="tabAtividades" dense align="left" class="text-primary"
                                active-color="primary" indicator-color="primary" narrow-indicator>
                                <q-tab name="pedidos" icon="receipt_long" label="Pedidos" no-caps />
                                <q-tab name="pagamentos" icon="payments" label="Pagamentos" no-caps />
                            </q-tabs>
                        </q-card-section>

                        <q-separator />

                        <q-card-section>
                            <q-skeleton v-if="isLoading" type="rect" height="160px" />

                            <div v-else-if="!atividadesVisiveis.length" class="text-center q-pa-lg">
                                <q-icon name="inbox" size="36px" color="grey-5" class="q-mb-xs" />
                                <div class="text-caption text-grey-7">{{ textoVazio }}</div>
                            </div>

                            <q-list v-else dense separator class="rounded-borders">
                                <q-item v-for="a in atividadesVisiveis" :key="a.id">
                                    <q-item-section avatar>
                                        <q-icon :name="a.icon" :color="a.color" size="20px" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label class="text-body2 text-weight-medium ellipsis">{{ a.titulo
                                            }}</q-item-label>
                                        <q-item-label class="text-caption text-grey-7 ellipsis">{{ a.subtitulo
                                            }}</q-item-label>
                                    </q-item-section>
                                    <q-item-section side top>
                                        <q-item-label class="text-weight-bold text-positive">{{ a.valor
                                            }}</q-item-label>
                                        <q-item-label class="text-caption text-grey-6">{{ a.quando }}</q-item-label>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <!-- Módulos de Acesso Rápido -->
            <div class="text-subtitle2 text-weight-bold q-mb-sm text-grey-8">Módulos de Vendas</div>
            <div class="row q-col-gutter-md">
                <div v-for="mod in modulos" :key="mod.key" class="col-12 col-sm-6 col-md-4">
                    <q-card class="cursor-pointer non-selectable full-height no-shadow module-card" bordered
                        tabindex="0" role="link" @click="navigateTo(mod.key)" @keydown.enter="navigateTo(mod.key)">
                        <q-card-section class="text-center q-pa-lg">
                            <q-icon :name="mod.icon" :color="mod.color" size="56px" class="q-mb-sm" />
                            <div class="text-h6 text-weight-bold q-mb-xs">{{ mod.titulo }}</div>
                            <div class="text-caption text-grey-7">{{ mod.descricao }}</div>
                            <q-badge v-if="!isLoading && mod.badge" :color="mod.color" outline
                                class="q-mt-md q-px-sm q-py-xs">
                                {{ mod.badge }}
                            </q-badge>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <div class="row items-center justify-center" :class="`text-${mod.color}`">
                                <span class="text-caption text-weight-bold">Acessar Módulo</span>
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
const navigateTo = (modulo) => router.push(`/vendas/${modulo}`)
const tabAtividades = ref('pedidos')

const STATUS_META = {
    criado: { icon: 'fiber_new', color: 'info' },
    processando: { icon: 'hourglass_empty', color: 'warning' },
    concluido: { icon: 'check_circle', color: 'positive' },
    cancelado: { icon: 'cancel', color: 'negative' },
}
const statusMeta = (status) => STATUS_META[status] ?? { icon: 'receipt_long', color: 'primary' }

const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['vendas', 'resumo'],
    queryFn: async () => (await api.get('/dashboards/vendas/')).data,
    placeholderData: (previous) => previous,
})

const kpis = computed(() => data.value?.kpis ?? {})
const alertas = computed(() => data.value?.alertas ?? {
    contas_vencidas: [],
    contas_a_vencer: [],
    pedidos_parados: [],
})
const pedidosRecentes = computed(() => data.value?.pedidos_recentes ?? [])
const pagamentosRecentes = computed(() => data.value?.pagamentos_recentes ?? [])

const formatCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))

const formatNumber = (v) =>
    new Intl.NumberFormat('pt-BR').format(Math.round(Number(v || 0)))

const tempoRelativo = (iso) => {
    if (!iso) return ''
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`
    if (diff < 604800) return `${Math.floor(diff / 86400)} d`
    return new Date(iso).toLocaleDateString('pt-BR')
}

const resumo = (lista, fmt) => {
    const itens = lista.slice(0, 2).map(fmt).join(', ')
    const resto = lista.length - 2
    return resto > 0 ? `${itens} e mais ${resto}` : itens
}

const alertasAtivos = computed(() => {
    const a = alertas.value
    const out = []

    if (a.contas_vencidas.length) {
        out.push({
            key: 'vencidas',
            icon: 'event_busy',
            color: 'negative',
            titulo: `${a.contas_vencidas.length} conta(s) vencida(s)`,
            resumo: resumo(a.contas_vencidas, c => `${c.cliente || 'Consumidor Final'} (${formatCurrency(c.valor_restante)})`),
            to: '/vendas/contas?filtro=vencidas',
        })
    }

    if (a.contas_a_vencer.length) {
        out.push({
            key: 'a_vencer',
            icon: 'event',
            color: 'warning',
            titulo: `${a.contas_a_vencer.length} conta(s) a vencer`,
            resumo: resumo(a.contas_a_vencer, c => `${c.cliente || 'Consumidor Final'} (${formatCurrency(c.valor_restante)})`),
            to: '/vendas/contas',
        })
    }

    if (a.pedidos_parados.length) {
        out.push({
            key: 'parados',
            icon: 'hourglass_empty',
            color: 'info',
            titulo: `${a.pedidos_parados.length} pedido(s) parado(s)`,
            resumo: resumo(a.pedidos_parados, p => `${p.cliente || 'Consumidor Final'} (${p.status_display})`),
            to: '/vendas/pedidos',
        })
    }

    return out
})

const hasAlertas = computed(() => alertasAtivos.value.length > 0)

const atividadesVisiveis = computed(() => {
    if (tabAtividades.value === 'pagamentos') {
        return pagamentosRecentes.value.map(pg => ({
            id: `pg-${pg.id}`,
            icon: 'check_circle',
            color: 'positive',
            titulo: pg.cliente || 'Consumidor Final',
            subtitulo: `${pg.meio_pagamento_display || 'Pagamento'} · Parcela ${pg.numero_parcela}/${pg.total_parcelas}`,
            valor: formatCurrency(pg.valor_pago),
            quando: tempoRelativo(pg.pago_em),
        }))
    }
    return pedidosRecentes.value.map(p => ({
        id: `p-${p.id}`,
        icon: statusMeta(p.status).icon,
        color: statusMeta(p.status).color,
        titulo: p.cliente || 'Consumidor Final',
        subtitulo: p.status_display || p.status,
        valor: formatCurrency(p.valor_total),
        quando: tempoRelativo(p.criado_em),
    }))
})

const textoVazio = computed(() =>
    tabAtividades.value === 'pagamentos'
        ? 'Nenhum pagamento registrado ainda.'
        : 'Nenhum pedido registrado ainda.'
)

const animVendas = ref(0)
const animTicket = ref(0)
const animAReceber = ref(0)
const animPedidos = ref(0)

watch(
    () => data.value?.kpis,
    (k) => {
        if (!k) return
        animateValue(animVendas, Number(k.vendas) || 0)
        animateValue(animTicket, Number(k.ticket_medio) || 0)
        animateValue(animAReceber, Number(k.a_receber) || 0)
        animateValue(animPedidos, Number(k.pedidos) || 0)
    },
    { immediate: true }
)

const mappedKpis = computed(() => [
    {
        label: 'Vendas no período',
        value: formatCurrency(animVendas.value),
        icon: 'trending_up',
        color: 'positive',
        style: { borderLeft: '4px solid #21BA45' },
        to: '/vendas/pedidos',
    },
    {
        label: 'Ticket médio',
        value: formatCurrency(animTicket.value),
        icon: 'receipt_long',
        color: 'primary',
        style: { borderLeft: '4px solid #1976D2' },
    },
    {
        label: 'A receber',
        value: formatCurrency(animAReceber.value),
        icon: 'account_balance_wallet',
        color: Number(kpis.value.a_receber) > 0 ? 'warning' : 'positive',
        style: { borderLeft: '4px solid #F2C037' },
        badge: alertas.value.contas_vencidas.length || null,
        to: '/vendas/contas',
    },
    {
        label: 'Pedidos',
        value: formatNumber(animPedidos.value),
        icon: 'shopping_cart',
        color: 'secondary',
        style: { borderLeft: '4px solid #26A69A' },
        to: '/vendas/pedidos',
    },
])

const modulos = computed(() => [
    {
        key: 'pdv',
        icon: 'storefront',
        color: 'purple',
        titulo: 'Ponto de Venda (PDV)',
        descricao: 'Frente de caixa e vendas rápidas ao balcão',
    },
    {
        key: 'pedidos',
        icon: 'receipt_long',
        color: 'primary',
        titulo: 'Pedidos de Venda',
        descricao: 'Gerenciar itens, clientes e status dos pedidos',
        badge: isLoading.value ? null : `${formatNumber(kpis.value.pedidos)} no período`,
    },
    {
        key: 'contas',
        icon: 'account_balance_wallet',
        color: 'green',
        titulo: 'Contas a Receber',
        descricao: 'Parcelas, vencimentos e quitação de recebíveis',
        badge: (!isLoading.value && Number(kpis.value.a_receber) > 0)
            ? formatCurrency(kpis.value.a_receber)
            : null,
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