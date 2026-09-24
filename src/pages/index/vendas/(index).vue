<template>
    <q-page>
        <div class="q-pa-md">

            <!-- Breadcrumbs -->
            <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
                <q-breadcrumbs-el label="Início" icon="home" to="/" />
                <q-breadcrumbs-el label="Vendas" icon="point_of_sale" />
            </q-breadcrumbs>

            <!-- Cabeçalho -->
            <div class="row items-center q-mb-lg">
                <q-icon name="point_of_sale" color="primary" size="32px" class="q-mr-sm" />
                <div>
                    <div class="text-h6 text-weight-bold">Vendas</div>
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
                    <div class="text-h6">Erro ao carregar dados de vendas</div>
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
                                    <q-item v-for="a in alertasAtivos" :key="a.key" clickable
                                        @click="$router.push(a.to)">
                                        <q-item-section avatar>
                                            <q-icon :name="a.icon" :color="a.color" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label class="text-weight-medium">{{ a.titulo }}</q-item-label>
                                            <q-item-label class="text-caption">{{ a.resumo }}</q-item-label>
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
                            <q-card-section class="q-pb-none">
                                <div class="row items-center q-mb-sm">
                                    <q-icon name="history" color="primary" size="22px" class="q-mr-sm" />
                                    <div class="text-subtitle1 text-weight-bold">Atividades recentes</div>
                                    <q-space />
                                    <q-btn flat dense size="sm" color="primary" label="Ver todas"
                                        @click="$router.push('/vendas/pedidos')" />
                                </div>

                                <q-tabs v-model="tabAtividades" dense align="left" class="text-primary"
                                    active-color="primary" indicator-color="primary" narrow-indicator>
                                    <q-tab name="pedidos" icon="receipt_long" label="Pedidos" />
                                    <q-tab name="pagamentos" icon="payments" label="Pagamentos" />
                                </q-tabs>
                            </q-card-section>

                            <q-separator />

                            <q-card-section>
                                <q-skeleton v-if="isLoading" type="rect" height="160px" />

                                <div v-else-if="!atividadesVisiveis.length" class="text-center q-pa-md">
                                    <q-icon name="inbox" size="32px" class="q-mb-sm text-caption" />
                                    <div class="text-caption">{{ textoVazio }}</div>
                                </div>

                                <q-list v-else dense separator>
                                    <!-- <q-item v-for="a in atividadesVisiveis" :key="a.id" clickable
                                        @click="a.to && $router.push(a.to)"> -->
                                    <q-item v-for="a in atividadesVisiveis" :key="a.id">
                                        <q-item-section avatar>
                                            <q-icon :name="a.icon" :color="a.color" size="20px" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label class="text-body2 ellipsis">{{ a.titulo }}</q-item-label>
                                            <q-item-label class="text-weight-light ellipsis">{{ a.subtitulo
                                            }}</q-item-label>
                                        </q-item-section>
                                        <q-item-section side top>
                                            <q-item-label class="text-weight-medium text-green">{{ a.valor
                                            }}</q-item-label>
                                            <q-item-label class="text-caption text-primary">{{ a.quando
                                            }}</q-item-label>
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
                    <div v-for="mod in modulos" :key="mod.key" class="col-12 col-sm-6 col-md-4">
                        <q-card class="cursor-pointer non-selectable full-height" tabindex="0" role="link"
                            @click="navigateTo(mod.key)" @keydown.enter="navigateTo(mod.key)">
                            <q-card-section class="text-center q-pa-lg">
                                <q-icon :name="mod.icon" :color="mod.color" size="64px" class="q-mb-md" />
                                <div class="text-h6 text-weight-bold q-mb-xs">{{ mod.titulo }}</div>
                                <div class="text-caption">{{ mod.descricao }}</div>
                                <q-badge v-if="!isLoading && mod.badge" :color="mod.color" outline class="q-mt-sm">
                                    {{ mod.badge }}
                                </q-badge>
                            </q-card-section>
                            <q-card-section class="q-pt-none">
                                <div class="row items-center justify-center" :class="`text-${mod.color}`">
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
const navigateTo = (modulo) => router.push(`/vendas/${modulo}`)
const tabAtividades = ref('pedidos')

// --- Meta por status do pedido ---
const STATUS_META = {
    criado: { icon: 'fiber_new', color: 'info' },
    processando: { icon: 'hourglass_empty', color: 'warning' },
    concluido: { icon: 'check_circle', color: 'positive' },
    cancelado: { icon: 'cancel', color: 'negative' },
}
const statusMeta = (status) => STATUS_META[status] ?? { icon: 'receipt_long', color: 'primary' }

// --- Vue Query ---
const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['vendas', 'resumo'],
    queryFn: async () => (await api.get('/dashboards/vendas/')).data,
    placeholderData: (previous) => previous,
})

// --- Atalhos reativos ---
const kpis = computed(() => data.value?.kpis ?? {})
const alertas = computed(() => data.value?.alertas ?? {
    contas_vencidas: [],
    contas_a_vencer: [],
    pedidos_parados: [],
})
const pedidosRecentes = computed(() => data.value?.pedidos_recentes ?? [])
const pagamentosRecentes = computed(() => data.value?.pagamentos_recentes ?? [])

// --- Formatadores ---
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

/** Resumo genérico: 2 primeiros itens + "e mais N" */
const resumo = (lista, fmt) => {
    const itens = lista.slice(0, 2).map(fmt).join(', ')
    const resto = lista.length - 2
    return resto > 0 ? `${itens} e mais ${resto}` : itens
}

// --- Alertas achatados ---
const alertasAtivos = computed(() => {
    const a = alertas.value
    const out = []

    if (a.contas_vencidas.length) {
        out.push({
            key: 'vencidas',
            icon: 'event_busy',
            color: 'negative',
            titulo: `${a.contas_vencidas.length} conta(s) vencida(s)`,
            resumo: resumo(a.contas_vencidas,
                c => `${c.cliente || 'Sem cliente'} (${formatCurrency(c.valor_restante)})`),
            to: '/vendas/contas?filtro=vencidas',
        })
    }

    if (a.contas_a_vencer.length) {
        out.push({
            key: 'a_vencer',
            icon: 'event',
            color: 'warning',
            titulo: `${a.contas_a_vencer.length} conta(s) a vencer`,
            resumo: resumo(a.contas_a_vencer,
                c => `${c.cliente || 'Sem cliente'} (${formatCurrency(c.valor_restante)})`),
            to: '/vendas/contas?filtro=a_vencer',
        })
    }

    if (a.pedidos_parados.length) {
        out.push({
            key: 'parados',
            icon: 'hourglass_empty',
            color: 'info',
            titulo: `${a.pedidos_parados.length} pedido(s) parado(s)`,
            resumo: resumo(a.pedidos_parados,
                p => `${p.cliente || 'Sem cliente'} (${p.status_display})`),
            to: '/vendas/pedidos?filtro=parados',
        })
    }

    return out
})

const hasAlertas = computed(() => alertasAtivos.value.length > 0)

// --- Atividades (depende da tab) ---
const atividadesVisiveis = computed(() => {
    if (tabAtividades.value === 'pagamentos') {
        return pagamentosRecentes.value.map(pg => ({
            id: `pg-${pg.id}`,
            icon: 'check_circle',
            color: 'positive',
            titulo: pg.cliente || 'Sem cliente',
            subtitulo: `${pg.meio_pagamento_display} · Parcela ${pg.numero_parcela}/${pg.total_parcelas}`,
            valor: formatCurrency(pg.valor_pago),
            quando: tempoRelativo(pg.pago_em),
            to: null,
        }))
    }
    return pedidosRecentes.value.map(p => ({
        id: `p-${p.id}`,
        icon: statusMeta(p.status).icon,
        color: statusMeta(p.status).color,
        titulo: p.cliente || 'Sem cliente',
        subtitulo: p.status_display,
        valor: formatCurrency(p.valor_total),
        quando: tempoRelativo(p.criado_em),
        to: `/vendas/pedidos/${p.id}`,
    }))
})

const textoVazio = computed(() =>
    tabAtividades.value === 'pagamentos'
        ? 'Nenhum pagamento registrado ainda.'
        : 'Nenhum pedido registrado ainda.'
)

// --- KPIs animados ---
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
        to: '/vendas/pedidos',
    },
    {
        label: 'Ticket médio',
        value: formatCurrency(animTicket.value),
        icon: 'receipt_long',
        color: 'primary',
    },
    {
        label: 'A receber',
        value: formatCurrency(animAReceber.value),
        icon: 'account_balance_wallet',
        color: Number(kpis.value.a_receber) > 0 ? 'warning' : 'positive',
        badge: alertas.value.contas_vencidas.length || null,
        to: '/vendas/contas',
    },
    {
        label: 'Pedidos',
        value: formatNumber(animPedidos.value),
        icon: 'shopping_cart',
        color: 'secondary',
        to: '/vendas/pedidos',
    },
])

// --- Módulos ---
const modulos = computed(() => [
    {
        key: 'pdv',
        icon: 'storefront',
        color: 'purple',
        titulo: 'Ponto de Venda (PDV)',
        descricao: 'Emissão de vendas rápidas e frente de caixa',
    },
    {
        key: 'pedidos',
        icon: 'receipt_long',
        color: 'primary',
        titulo: 'Pedidos de Venda',
        descricao: 'Gerenciar vendas, itens e status dos pedidos',
        badge: isLoading.value ? null : `${formatNumber(kpis.value.pedidos)} no período`,
    },
    {
        key: 'contas',
        icon: 'account_balance_wallet',
        color: 'green',
        titulo: 'Contas a Receber',
        descricao: 'Parcelas, vencimentos e registros de pagamento',
        badge: (!isLoading.value && Number(kpis.value.a_receber) > 0)
            ? formatCurrency(kpis.value.a_receber)
            : null,
    },
])
</script>