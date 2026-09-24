<template>
    <q-dialog v-model="open" maximized transition-show="fade" transition-hide="fade">
        <q-card class="column no-wrap receipt-dialog-card">
            <!-- HEADER FIXO -->
            <q-card-section class="row items-center no-wrap bg-primary text-white q-py-sm q-px-md">
                <q-icon name="receipt_long" size="28px" class="q-mr-sm" />
                <div>
                    <div class="text-h6">Comprovante do Pedido</div>
                    <div class="text-caption" style="opacity: .85">
                        Visualização do cupom
                    </div>
                </div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup color="white" />
            </q-card-section>

            <!-- CORPO ROLÁVEL -->
            <q-card-section class="col scroll q-pa-md flex flex-center receipt-bg">
                <div v-if="loadingDetalhes" class="text-center q-pa-xl">
                    <q-spinner color="primary" size="50px" />
                    <div class="text-grey-7 q-mt-md">Carregando comprovante...</div>
                </div>

                <div v-else-if="!pedidoDetalhes" class="text-center q-pa-xl text-grey-7">
                    <q-icon name="error_outline" size="60px" />
                    <div class="q-mt-md">Não foi possível carregar os detalhes do pedido.</div>
                </div>

                <div v-else class="receipt-paper">
                    <div class="receipt-header">
                        <div class="receipt-title">COMPROVANTE DE VENDA</div>
                        <div class="receipt-sub">NÃO É DOCUMENTO FISCAL</div>
                    </div>

                    <div class="receipt-divider">================================</div>

                    <div class="receipt-row">
                        <span>PEDIDO</span>
                        <span>#{{ pedidoDetalhes.id }}</span>
                    </div>
                    <div class="receipt-row">
                        <span>STATUS</span>
                        <span>{{ formatStatus(pedidoDetalhes.status).toUpperCase() }}</span>
                    </div>

                    <div class="receipt-divider">--------------------------------</div>

                    <div class="receipt-block">
                        <div class="receipt-label">CLIENTE</div>
                        <div class="receipt-value">{{ nomeCliente }}</div>
                    </div>

                    <div class="receipt-block">
                        <div class="receipt-label">DATA / HORA</div>
                        <div class="receipt-value">{{ formatDate(pedidoDetalhes.criado_em) }}</div>
                    </div>

                    <div class="receipt-block">
                        <div class="receipt-label">FORMA DE PAGAMENTO</div>
                        <div class="receipt-value">{{ formatMeioPagamento(metodoPagamento) }}</div>
                    </div>

                    <template v-if="valorRecebido > 0">
                        <div class="receipt-block">
                            <div class="receipt-row">
                                <span class="receipt-label">VALOR RECEBIDO</span>
                                <span>R$ {{ formatCurrency(valorRecebido) }}</span>
                            </div>
                            <div class="receipt-row" v-if="valorPendente > 0">
                                <span class="receipt-label">VALOR PENDENTE</span>
                                <span>R$ {{ formatCurrency(valorPendente) }}</span>
                            </div>
                        </div>
                    </template>

                    <div class="receipt-divider">--------------------------------</div>

                    <div class="receipt-label q-mb-sm">ITENS</div>

                    <div v-if="loadingItens" class="receipt-muted text-center q-pa-md">
                        Carregando itens...
                    </div>

                    <div v-else-if="itensDoPedido.length">
                        <div v-for="(item, index) in itensDoPedido" :key="index" class="receipt-item">
                            <div class="receipt-item-name">{{ item.nome }}</div>
                            <div class="receipt-row receipt-item-calc">
                                <span>{{ item.quantidade }} x {{ formatCurrency(item.preco) }}</span>
                                <span>{{ formatCurrency(item.subtotal) }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-else class="receipt-muted text-center q-pa-md">
                        Nenhum item neste pedido.
                    </div>

                    <div class="receipt-divider">--------------------------------</div>

                    <div class="receipt-row">
                        <span>QTD. TOTAL</span>
                        <span>{{ pedidoDetalhes.quantidade_total ?? itensDoPedido.length ?? 0 }}</span>
                    </div>

                    <div class="receipt-divider">================================</div>

                    <div class="receipt-total">
                        <span>TOTAL</span>
                        <span>R$ {{ formatCurrency(valorTotalDetalhes) }}</span>
                    </div>

                    <div class="receipt-divider">================================</div>

                    <div class="receipt-footer">
                        <div>OBRIGADO PELA PREFERÊNCIA!</div>
                        <div class="q-mt-xs">Emitido em {{ new Date().toLocaleString('pt-BR') }}</div>
                    </div>
                </div>
            </q-card-section>

            <!-- FOOTER FIXO -->
            <q-separator />
            <q-card-section class="q-pa-md">
                <div class="row q-col-gutter-sm justify-end">
                    <div class="col-12 col-sm-auto">
                        <q-btn class="full-width bg-green" flat color="white" icon="print" label="Imprimir" no-caps
                            :disable="!pedidoDetalhes" @click="printReceipt" />
                    </div>
                    <div class="col-12 col-sm-auto">
                        <q-btn class="full-width" unelevated color="primary" icon="check" label="Fechar" no-caps
                            v-close-popup />
                    </div>
                </div>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { api } from '@/boot/axios'
import { useQuery } from '@tanstack/vue-query'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    pedidoId: { type: [Number, String], default: null }
})

const emit = defineEmits(['update:modelValue'])

// `v-model` bidirecional
const open = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})

// Só dispara a query quando o dialog está aberto E temos ID
const activeId = computed(() => (open.value ? props.pedidoId : null))

// ============================================================
// Queries — reutiliza as mesmas queryKeys da página, então o
// Vue Query aproveita o cache já populado (produtos, movimentações)
// ============================================================
const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => (await api.get('/produtos/')).data
})

const { data: movimentacoes, isLoading: loadingMovimentacoes } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async () => (await api.get('/movimentacoes/')).data
})

const { data: pedidoDetalhes, isLoading: loadingDetalhes } = useQuery({
    queryKey: ['pedido-detalhes', activeId],
    queryFn: async () => (await api.get(`/pedidos/${activeId.value}/`)).data,
    enabled: computed(() => !!activeId.value)
})

// ============================================================
// Normalização dos itens (mesma lógica, agora isolada aqui)
// ============================================================
const itensDoPedido = computed(() => {
    if (!pedidoDetalhes.value) return []
    const p = pedidoDetalhes.value

    let rawItens = p.itens ?? p.items ?? p.produtos_itens ?? p.pedido_itens ?? null

    if (!Array.isArray(rawItens)) {
        const ids = Array.isArray(p.movimentacoes) ? p.movimentacoes : []
        if (!ids.length) return []

        const todas = movimentacoes.value || []
        rawItens = ids
            .map(ref => {
                if (ref && typeof ref === 'object') return ref
                return todas.find(m => m.id === ref) || null
            })
            .filter(Boolean)
    }

    if (!Array.isArray(rawItens) || rawItens.length === 0) return []

    return rawItens.map(item => {
        let produtoObj = null
        if (item.produto && typeof item.produto === 'object') {
            produtoObj = item.produto
        } else {
            const pid =
                item.produto_id ??
                (typeof item.produto === 'number' ? item.produto : null) ??
                (typeof item.produto === 'string' && !isNaN(Number(item.produto))
                    ? Number(item.produto)
                    : null)
            if (pid != null) {
                produtoObj = (produtos.value || []).find(x => x.id === pid) || null
            }
        }

        const quantidade =
            Number(item.quantidade ?? item.qtd ?? item.qtde ?? item.quantity ?? 0) || 0

        let preco =
            parseFloat(
                item.preco_unitario ??
                item.preco ??
                item.valor_unitario ??
                item.valor ??
                produtoObj?.preco ??
                0
            ) || 0

        if (!preco && produtoObj?.id) {
            const cat = (produtos.value || []).find(x => x.id === produtoObj.id)
            if (cat) preco = parseFloat(cat.preco) || 0
        }

        const subtotal =
            item.subtotal != null
                ? parseFloat(item.subtotal)
                : item.total != null
                    ? parseFloat(item.total)
                    : quantidade * preco

        const nome =
            produtoObj?.nome ||
            item.produto_nome ||
            item.nome_produto ||
            item.nome ||
            (item.produto_id != null ? `Produto #${item.produto_id}` : 'Produto')

        return { nome, quantidade, preco, subtotal }
    })
})

// Loading dos itens = ainda temos IDs de movimentações pendentes de resolução
const loadingItens = computed(() => {
    if (!pedidoDetalhes.value) return false
    const ids = pedidoDetalhes.value.movimentacoes
    if (!Array.isArray(ids) || !ids.length) return false
    return loadingMovimentacoes.value && !movimentacoes.value?.length
})

// ============================================================
// Derivados
// ============================================================
const valorTotalDetalhes = computed(() => {
    if (!pedidoDetalhes.value) return 0
    if (pedidoDetalhes.value.valor_total != null) {
        return parseFloat(pedidoDetalhes.value.valor_total)
    }
    return itensDoPedido.value.reduce((sum, item) => sum + item.subtotal, 0)
})

const metodoPagamento = computed(() => {
    const contas = pedidoDetalhes.value?.contas_receber
    if (!Array.isArray(contas) || !contas.length) return null
    return contas.find(c => c.meio_pagamento)?.meio_pagamento || null
})

const valorRecebido = computed(() => {
    const v = pedidoDetalhes.value?.valor_recebido
    return v != null ? parseFloat(v) : 0
})

const valorPendente = computed(() => {
    const v = pedidoDetalhes.value?.valor_pendente
    return v != null ? parseFloat(v) : 0
})

const nomeCliente = computed(() => {
    const p = pedidoDetalhes.value
    if (!p) return '-'
    return (
        p.cliente?.nome ||
        p.cliente_nome ||
        (typeof p.cliente === 'string' ? p.cliente : null) ||
        'Não informado'
    )
})

// ============================================================
// Formatadores locais (isolados — não dependem da página)
// ============================================================
const formatCurrency = value => {
    if (value === null || value === undefined) return '0,00'
    return parseFloat(value).toFixed(2).replace('.', ',')
}

const formatDate = dateString => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return (
        date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
}

const formatStatus = status => {
    const map = {
        criado: 'Criado',
        processando: 'Processando',
        concluido: 'Concluído',
        cancelado: 'Cancelado'
    }
    return map[status] || status
}

const formatMeioPagamento = meio => {
    const map = {
        dinheiro: 'Dinheiro',
        pix: 'PIX',
        cartao_debito: 'Cartão de Débito',
        cartao_credito: 'Cartão de Crédito',
        cartao: 'Cartão',
        boleto: 'Boleto',
        transferencia: 'Transferência',
        transferencia_bancaria: 'Transferência Bancária'
    }
    return map[meio] || meio || 'Não informado'
}

// ============================================================
// Impressão
// ============================================================
const printReceipt = () => {
    const paper = document.querySelector('.receipt-paper')
    if (!paper) return
    const win = window.open('', '_blank', 'width=420,height=700')
    win.document.write(`
        <html>
            <head>
                <title>Comprovante do Pedido</title>
                <style>
                    * { box-sizing: border-box; }
                    body {
                        font-family: 'Courier New', 'Roboto Mono', monospace;
                        background: #fdfbf3;
                        color: #1a1a1a;
                        padding: 16px;
                        font-size: 13px;
                        line-height: 1.5;
                    }
                    .receipt-paper {
                        background: #fdfbf3;
                        color: #1a1a1a;
                        max-width: 380px;
                        margin: 0 auto;
                        font-family: 'Courier New', 'Roboto Mono', monospace;
                        font-size: 13px;
                        line-height: 1.5;
                    }
                    .receipt-header { text-align: center; }
                    .receipt-title { font-weight: bold; font-size: 15px; letter-spacing: 1px; }
                    .receipt-sub { font-size: 10px; color: #555; margin-top: 2px; letter-spacing: .5px; }
                    .receipt-divider { color: #555; font-size: 12px; margin: 8px 0; white-space: nowrap; overflow: hidden; }
                    .receipt-row { display: flex; justify-content: space-between; gap: 8px; }
                    .receipt-label { font-size: 11px; color: #555; letter-spacing: .5px; margin-bottom: 2px; }
                    .receipt-value { font-weight: bold; }
                    .receipt-block { margin-bottom: 8px; }
                    .receipt-item { margin-bottom: 6px; }
                    .receipt-item-name { font-weight: bold; }
                    .receipt-item-calc { font-size: 12px; }
                    .receipt-total {
                        display: flex; justify-content: space-between;
                        font-size: 16px; font-weight: bold;
                        padding: 6px 0;
                        border-top: 1px solid #1a1a1a;
                        border-bottom: 1px solid #1a1a1a;
                    }
                    .receipt-footer { text-align: center; font-size: 11px; color: #555; margin-top: 12px; letter-spacing: .5px; }
                    .receipt-muted { color: #777; text-align: center; padding: 12px; }
                    .q-mt-xs { margin-top: 4px; }
                    .q-mb-sm { margin-bottom: 8px; }
                    .text-center { text-align: center; }
                    @media print {
                        body { padding: 0; background: #fff; }
                        .receipt-paper { background: #fff; max-width: 100%; }
                    }
                </style>
            </head>
            <body>${paper.outerHTML}</body>
        </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
        win.print()
        win.close()
    }, 250)
}
</script>

<style scoped>
.receipt-dialog-card {
    max-width: 640px;
    width: 100%;
    margin: auto;
    max-height: 90vh;
    overflow: hidden;
    border-radius: 8px;
}

.receipt-bg {
    background: #e9e6dc;
}

.receipt-paper {
    background: #fdfbf3;
    color: #1a1a1a;
    padding: 24px 20px;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    font-family: 'Courier New', 'Roboto Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    border-radius: 2px;
    background-image:
        linear-gradient(45deg, transparent 33.333%, #e9e6dc 33.333%, #e9e6dc 66.667%, transparent 66.667%),
        linear-gradient(-45deg, transparent 33.333%, #e9e6dc 33.333%, #e9e6dc 66.667%, transparent 66.667%);
    background-size: 12px 24px;
    background-repeat: repeat-x;
    background-position: top center, bottom center;
}

.receipt-header {
    text-align: center;
}

.receipt-title {
    font-weight: bold;
    font-size: 15px;
    letter-spacing: 1px;
}

.receipt-sub {
    font-size: 10px;
    color: #555;
    margin-top: 2px;
    letter-spacing: .5px;
}

.receipt-divider {
    color: #555;
    font-size: 12px;
    margin: 8px 0;
    white-space: nowrap;
    overflow: hidden;
    letter-spacing: 0;
    text-align: center;
}

.receipt-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
}

.receipt-label {
    font-size: 11px;
    color: #555;
    letter-spacing: .5px;
    margin-bottom: 2px;
}

.receipt-value {
    font-weight: bold;
    word-break: break-word;
}

.receipt-block {
    margin-bottom: 8px;
}

.receipt-item {
    margin-bottom: 6px;
}

.receipt-item-name {
    font-weight: bold;
    word-break: break-word;
}

.receipt-item-calc {
    font-size: 12px;
    color: #333;
}

.receipt-muted {
    color: #777;
    font-size: 12px;
}

.receipt-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
    padding: 6px 0;
    border-top: 1px solid #1a1a1a;
    border-bottom: 1px solid #1a1a1a;
    margin: 4px 0;
}

.receipt-footer {
    text-align: center;
    font-size: 11px;
    color: #555;
    margin-top: 12px;
    letter-spacing: .5px;
}

@media (max-width: 599px) {
    .receipt-dialog-card {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
        margin: 0;
    }

    .receipt-bg {
        background: #fdfbf3;
        padding: 0 !important;
    }

    .receipt-paper {
        padding: 20px 16px;
        max-width: 100%;
        box-shadow: none;
        border-radius: 0;
        background-image: none;
        background: #fdfbf3;
    }
}
</style>