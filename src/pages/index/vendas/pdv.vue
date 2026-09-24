<template>
    <q-page class="q-pa-sm q-pa-md-sm pdv-page">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Vendas" icon="point_of_sale" to="/vendas" />
            <q-breadcrumbs-el label="PDV" icon="storefront" />
        </q-breadcrumbs>

        <!-- Cabeçalho -->
        <div class="row items-center q-mb-md page-header">
            <q-icon name="storefront" color="purple-7" size="28px" class="q-mr-sm" />
            <div class="text-h5 text-weight-bold">Ponto de Venda (PDV)</div>
        </div>

        <div class="row q-col-gutter-md">
            <!-- ============================== -->
            <!-- COLUNA 1: Listagem de Produtos -->
            <!-- ============================== -->
            <div class="col-12 col-md-7">
                <q-card bordered class="no-shadow">
                    <q-card-section class="q-pb-sm">
                        <q-input ref="searchRef" v-model="search" dense outlined autofocus
                            placeholder="Buscar produto ou escanear código..." @keyup.enter="handleBarcodeEnter">
                            <template #prepend>
                                <q-icon name="search" />
                            </template>
                            <template #append>
                                <q-icon v-if="search" name="clear" class="cursor-pointer" @click="search = ''" />
                            </template>
                        </q-input>
                        <div class="text-caption text-grey-6 q-mt-xs q-ml-xs">
                            <q-icon name="keyboard_return" size="14px" /> Pressione
                            <strong>Enter</strong> para adicionar o primeiro resultado
                        </div>
                    </q-card-section>

                    <q-separator />

                    <q-card-section class="produtos-scroll q-pt-md">
                        <!-- Empty state -->
                        <div v-if="filteredProdutos.length === 0" class="text-center text-grey-6 q-pa-xl">
                            <q-icon name="inventory_2" size="56px" class="q-mb-sm text-grey-4" />
                            <div class="text-subtitle1">Nenhum produto encontrado</div>
                            <div class="text-caption">Tente outro termo de busca</div>
                        </div>

                        <!-- Grid de cards -->
                        <div v-else class="row q-col-gutter-sm">
                            <div v-for="prod in filteredProdutos" :key="prod.id" class="col-12 col-sm-6">
                                <q-card flat bordered class="product-card cursor-pointer"
                                    :class="{ 'product-disabled': prod.saldo_estoque <= 0 }"
                                    @click="adicionarAoCarrinho(prod)">
                                    <q-card-section class="q-py-sm q-px-md">
                                        <div class="row items-start no-wrap">
                                            <div class="col ellipsis q-pr-sm">
                                                <div class="text-weight-medium product-name ellipsis-2-lines">
                                                    {{ prod.nome }}
                                                </div>
                                                <div class="text-caption text-grey-6 ellipsis">
                                                    {{ prod.descricao || '—' }}
                                                </div>
                                            </div>
                                            <q-btn flat round dense size="sm" color="primary" icon="add"
                                                :disable="prod.saldo_estoque <= 0"
                                                @click.stop="adicionarAoCarrinho(prod)" />
                                        </div>
                                        <div class="row items-center justify-between q-mt-md">
                                            <div class="text-h6 text-primary text-weight-bold">
                                                R$ {{ formatCurrency(prod.preco) }}
                                            </div>
                                            <q-badge :color="prod.saldo_estoque > 0 ? 'positive' : 'negative'"
                                                class="q-pa-xs">
                                                {{ prod.saldo_estoque > 0 ? `Estoque: ${prod.saldo_estoque}` : `Sem
                                                estoque` }}
                                            </q-badge>
                                        </div>
                                    </q-card-section>
                                </q-card>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- ============================== -->
            <!-- COLUNA 2: Carrinho             -->
            <!-- ============================== -->
            <div class="col-12 col-md-5 carrinho-col">
                <q-card bordered class="no-shadow carrinho-card">
                    <!-- Header com contador + limpar -->
                    <q-card-section class="q-py-sm">
                        <div class="row items-center no-wrap">
                            <q-icon name="shopping_cart" class="q-mr-sm" size="24px" />
                            <div class="col text-h6 text-weight-bold">Pedido Atual</div>
                            <q-badge v-if="carrinho.length" color="primary"
                                :label="`${carrinho.length} ${carrinho.length === 1 ? 'item' : 'itens'}`"
                                class="q-pa-xs" />
                            <q-btn v-if="carrinho.length" flat round dense size="sm" color="negative"
                                icon="delete_sweep" class="q-ml-sm" @click="confirmarLimparCarrinho">
                                <q-tooltip>Limpar carrinho</q-tooltip>
                            </q-btn>
                        </div>
                    </q-card-section>
                    <q-separator />

                    <!-- Cliente com busca -->
                    <q-card-section class="q-py-sm">
                        <q-select v-model="clienteId" :options="clientesFiltrados" use-input hide-selected fill-input
                            input-debounce="0" @filter="filterClientes" emit-value map-options outlined dense clearable
                            label="Cliente (Opcional)" placeholder="Consumidor Final">
                            <template #prepend>
                                <q-icon name="person" />
                            </template>
                        </q-select>
                    </q-card-section>
                    <q-separator />

                    <!-- Itens do carrinho -->
                    <q-card-section class="carrinho-items q-pt-sm">
                        <q-list v-if="carrinho.length > 0" separator>
                            <q-item v-for="(item, index) in carrinho" :key="item.produto_id" class="q-py-sm">
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">
                                        {{ item.nome }}
                                    </q-item-label>
                                    <q-item-label caption>
                                        R$ {{ formatCurrency(item.preco) }} × {{ item.quantidade }}
                                        <span class="text-primary text-weight-bold q-ml-xs">
                                            = R$ {{ formatCurrency(item.preco * item.quantidade) }}
                                        </span>
                                    </q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <div class="row items-center no-wrap">
                                        <q-btn flat dense round icon="remove" size="sm" color="grey-7"
                                            @click="alterarQuantidade(index, -1)" />
                                        <q-input v-model.number="item.quantidade" type="number" min="1"
                                            :max="item.saldo_estoque" dense outlined class="qty-input q-mx-xs"
                                            @update:model-value="validarQuantidade(index)" />
                                        <q-btn flat dense round icon="add" size="sm" color="primary"
                                            @click="alterarQuantidade(index, 1)" />
                                        <q-btn flat dense round icon="close" color="negative" size="sm" class="q-ml-sm"
                                            @click="removerDoCarrinho(index)" />
                                    </div>
                                </q-item-section>
                            </q-item>
                        </q-list>

                        <div v-else class="text-center text-grey-6 q-pa-xl">
                            <q-icon name="add_shopping_cart" size="56px" class="q-mb-sm text-grey-4" />
                            <div class="text-subtitle1">Carrinho vazio</div>
                            <div class="text-caption">Clique em um produto para adicionar</div>
                        </div>
                    </q-card-section>

                    <!-- Footer do carrinho -->
                    <div class="carrinho-footer">
                        <q-separator />
                        <q-card-section class="q-py-sm">
                            <div class="row justify-between items-center">
                                <div class="text-subtitle1 text-weight-medium">Total:</div>
                                <div class="text-h4 text-weight-bold text-primary">
                                    R$ {{ formatCurrency(totalPedido) }}
                                </div>
                            </div>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <q-btn color="positive" class="full-width" size="lg" icon="check_circle"
                                label="Finalizar Venda" :loading="saving" @click="abrirDialogPagamento"
                                :disable="carrinho.length === 0" />
                        </q-card-section>
                    </div>
                </q-card>
            </div>
        </div>

        <!-- ========================================= -->
        <!-- DIÁLOGO DE FINALIZAÇÃO / PAGAMENTO        -->
        <!-- ========================================= -->
        <q-dialog v-model="dialogPagamento" persistent :maximized="$q.screen.lt.sm" transition-show="fade"
            transition-hide="fade">
            <q-card class="column no-wrap payment-card" :style="paymentCardStyle">
                <!-- Header -->
                <q-card-section class="row items-center no-wrap bg-positive text-white q-py-sm q-px-md">
                    <q-icon name="point_of_sale" size="28px" class="q-mr-sm" />
                    <div class="col">
                        <div class="text-h6">Finalizar Venda</div>
                        <div class="text-caption" style="opacity: .85">
                            Confirme o pagamento
                        </div>
                    </div>
                    <q-btn icon="close" flat round dense v-close-popup color="white" />
                </q-card-section>

                <!-- Corpo -->
                <q-card-section class="col scroll q-pa-md">
                    <!-- Total em destaque -->
                    <div class="text-center q-py-md bg-grey-2 rounded-borders">
                        <div class="text-caption text-grey-7 letter-spacing">
                            TOTAL A PAGAR
                        </div>
                        <div class="text-h4 text-weight-bold text-primary">
                            R$ {{ formatCurrency(totalPedido) }}
                        </div>
                    </div>

                    <!-- Toggle pagar agora -->
                    <div class="q-mt-lg">
                        <q-toggle v-model="pagarAgora" label="Receber pagamento agora" color="positive"
                            class="text-weight-medium" />
                    </div>

                    <template v-if="pagarAgora">
                        <!-- Meio de pagamento -->
                        <q-select v-model="meioPagamentoSelecionado" :options="meioPagamentoOptions" emit-value
                            map-options outlined dense label="Meio de Pagamento *" class="q-mt-md">
                            <template #prepend>
                                <q-icon name="payments" />
                            </template>
                        </q-select>

                        <!-- Dinheiro: valor recebido + troco -->
                        <template v-if="meioPagamentoSelecionado === 'dinheiro'">
                            <q-input v-model.number="valorRecebido" type="number" min="0" step="0.01" outlined dense
                                prefix="R$" label="Valor recebido" class="q-mt-md">
                                <template #prepend>
                                    <q-icon name="attach_money" />
                                </template>
                                <template #append>
                                    <q-btn flat dense size="sm" color="primary" label="Exato" no-caps
                                        @click="valorRecebido = totalPedido" />
                                </template>
                            </q-input>

                            <div v-if="valorRecebido >= totalPedido && totalPedido > 0"
                                class="row items-center q-mt-md q-pa-md bg-green-1 rounded-borders">
                                <q-icon name="savings" color="positive" size="24px" class="q-mr-sm" />
                                <div class="text-subtitle2 text-grey-8">Troco:</div>
                                <q-space />
                                <div class="text-h5 text-weight-bold text-positive">
                                    R$ {{ formatCurrency(valorRecebido - totalPedido) }}
                                </div>
                            </div>
                        </template>
                    </template>
                </q-card-section>

                <!-- Footer -->
                <q-separator />
                <q-card-section class="q-pa-md">
                    <div class="row q-col-gutter-sm justify-end">
                        <div class="col-12 col-sm-auto">
                            <q-btn class="full-width" flat color="grey-7" label="Cancelar" no-caps v-close-popup />
                        </div>
                        <div class="col-12 col-sm-auto">
                            <q-btn class="full-width" unelevated color="positive" icon="check_circle"
                                :label="pagarAgora ? 'Confirmar e Receber' : 'Confirmar Venda'" no-caps
                                :loading="saving" @click="confirmarVenda" />
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const $q = useQuasar()
const queryClient = useQueryClient()

// --- Estado ---
const search = ref('')
const searchRef = ref(null)
const clienteId = ref(null)
const carrinho = ref([])

// Diálogo de pagamento
const dialogPagamento = ref(false)
const pagarAgora = ref(false)
const meioPagamentoSelecionado = ref(null)
const valorRecebido = ref(0)

// --- Vue Query ---
const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => (await api.get('/produtos/')).data
})

const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => (await api.get('/clientes/')).data
})

// --- Opções ---
const clientesOptions = computed(() =>
    (clientes.value || []).map(c => ({ label: c.nome, value: c.id }))
)

const meioPagamentoOptions = [
    { label: 'Dinheiro', value: 'dinheiro' },
    { label: 'Pix', value: 'pix' },
    { label: 'Cartão de Débito', value: 'cartao_debito' },
    { label: 'Cartão de Crédito', value: 'cartao_credito' },
    { label: 'Outro', value: 'outro' }
]

// Estilo do card do dialog (desktop only — mobile usa `maximized`)
const paymentCardStyle = computed(() => {
    if ($q.screen.lt.sm) return {}
    return { width: '500px', maxWidth: '90vw' }
})

// --- Filtros ---
const filteredProdutos = computed(() => {
    const lista = produtos.value || []
    const ativos = lista.filter(p => p.ativo)
    if (!search.value) return ativos
    const term = search.value.toLowerCase()
    return ativos.filter(p => p.nome.toLowerCase().includes(term))
})

const clientesFiltrados = ref([])
const filterClientes = (val, update) => {
    update(() => {
        const term = (val || '').toLowerCase().trim()
        if (!term) {
            clientesFiltrados.value = clientesOptions.value
            return
        }
        clientesFiltrados.value = clientesOptions.value.filter(opt =>
            opt.label.toLowerCase().includes(term)
        )
    })
}

// --- Computed ---
const totalPedido = computed(() =>
    carrinho.value.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
)

// --- Helpers ---
const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0,00'
    return parseFloat(value).toFixed(2).replace('.', ',')
}

// ============================================================
// Adicionar ao carrinho (clique no card OU Enter na busca)
// ============================================================
const adicionarAoCarrinho = (produto) => {
    if (produto.saldo_estoque <= 0) {
        $q.notify({ color: 'warning', message: 'Produto sem estoque.', icon: 'warning' })
        return
    }
    const existente = carrinho.value.find(i => i.produto_id === produto.id)
    if (existente) {
        if (existente.quantidade < produto.saldo_estoque) {
            existente.quantidade++
        } else {
            $q.notify({ color: 'warning', message: 'Estoque insuficiente!', icon: 'warning' })
        }
    } else {
        carrinho.value.push({
            produto_id: produto.id,
            nome: produto.nome,
            preco: parseFloat(produto.preco),
            quantidade: 1,
            saldo_estoque: produto.saldo_estoque
        })
    }
}

// ============================================================
// Enter na busca → adiciona o primeiro resultado (ou match exato)
// Isso é o que torna o leitor de código de barras funcionar nativamente
// (leitores emitem o código + Enter)
// ============================================================
const handleBarcodeEnter = () => {
    const term = search.value.trim()
    if (!term) return

    // 1) Match exato por nome (case-insensitive)
    const termLower = term.toLowerCase()
    const exato = (produtos.value || []).find(
        p => p.ativo && p.nome.toLowerCase() === termLower
    )
    if (exato) {
        adicionarAoCarrinho(exato)
        search.value = ''
        return
    }

    // 2) Senão, se houver exatamente 1 resultado, adiciona ele
    if (filteredProdutos.value.length === 1) {
        adicionarAoCarrinho(filteredProdutos.value[0])
        search.value = ''
        return
    }

    // 3) Nenhum / vários resultados → notifica
    if (filteredProdutos.value.length === 0) {
        $q.notify({ color: 'warning', message: 'Nenhum produto encontrado.', icon: 'search_off' })
    } else {
        $q.notify({
            color: 'info',
            message: `${filteredProdutos.value.length} produtos encontrados. Clique em um para adicionar.`,
            icon: 'info'
        })
    }
}

// ============================================================
// Operações no carrinho
// ============================================================
const alterarQuantidade = (index, delta) => {
    const item = carrinho.value[index]
    const novaQtd = item.quantidade + delta
    if (novaQtd <= 0) {
        removerDoCarrinho(index)
        return
    }
    if (novaQtd > item.saldo_estoque) {
        $q.notify({ color: 'warning', message: 'Estoque máximo atingido!', icon: 'warning' })
        return
    }
    item.quantidade = novaQtd
}

// Chamado quando o usuário digita direto no input
const validarQuantidade = (index) => {
    const item = carrinho.value[index]
    if (!item) return
    let q = parseInt(item.quantidade) || 1
    if (q < 1) q = 1
    if (q > item.saldo_estoque) {
        q = item.saldo_estoque
        $q.notify({
            color: 'warning',
            message: `Estoque máximo: ${item.saldo_estoque}`,
            icon: 'warning'
        })
    }
    item.quantidade = q
}

const removerDoCarrinho = (index) => {
    carrinho.value.splice(index, 1)
}

const confirmarLimparCarrinho = () => {
    $q.dialog({
        title: 'Limpar carrinho',
        message: 'Deseja remover todos os itens do pedido?',
        cancel: true,
        persistent: true
    }).onOk(() => {
        carrinho.value = []
    })
}

// ============================================================
// Pagamento
// ============================================================
const abrirDialogPagamento = () => {
    pagarAgora.value = false
    meioPagamentoSelecionado.value = null
    valorRecebido.value = 0
    dialogPagamento.value = true
}

const { mutateAsync: criarVenda, isPending: saving } = useMutation({
    mutationFn: async (payload) => (await api.post('/pedidos/', payload)).data,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
        queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
        queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    }
})

const confirmarVenda = async () => {
    if (pagarAgora.value && !meioPagamentoSelecionado.value) {
        $q.notify({
            color: 'warning',
            message: 'Selecione o meio de pagamento.',
            icon: 'warning'
        })
        return
    }

    try {
        const payload = {
            cliente: clienteId.value,
            status: 'criado',
            itens: carrinho.value.map(i => ({
                produto_id: i.produto_id,
                quantidade: i.quantidade
            })),
            pagar_agora: pagarAgora.value,
            meio_pagamento: pagarAgora.value ? meioPagamentoSelecionado.value : null
        }

        await criarVenda(payload)

        $q.notify({
            color: 'positive',
            message: 'Venda finalizada com sucesso!',
            icon: 'check_circle',
            timeout: 3000
        })

        // Reset
        carrinho.value = []
        clienteId.value = null
        dialogPagamento.value = false
        valorRecebido.value = 0
        search.value = ''
        searchRef.value?.focus()
    } catch (error) {
        const data = error.response?.data
        const errorMsg =
            data?.detail ||
            data?.itens?.[0] ||
            data?.non_field_errors?.[0] ||
            'Erro ao finalizar venda'
        $q.notify({ color: 'negative', message: errorMsg, icon: 'error', timeout: 6000 })
    }
}
</script>

<style scoped>
.page-header {
    min-height: 40px;
}

/* ====== Lista de produtos ====== */
.produtos-scroll {
    max-height: 65vh;
    overflow-y: auto;
}

.product-card {
    transition: all 0.15s ease;
    height: 100%;
}

.product-card:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
}

.product-disabled {
    opacity: 0.55;
    cursor: not-allowed !important;
}

.product-disabled:hover {
    transform: none;
    box-shadow: none;
}

.product-name {
    line-height: 1.25;
    min-height: 2.4em;
}

/* ====== Carrinho ====== */
.carrinho-card {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.carrinho-items {
    flex: 1;
    overflow-y: auto;
    max-height: 45vh;
}

.carrinho-footer {
    margin-top: auto;
}

/* Input de quantidade compacto */
.qty-input {
    width: 62px;
}

.qty-input :deep(.q-field__control) {
    height: 32px !important;
    min-height: 32px !important;
    padding: 0 !important;
}

.qty-input :deep(.q-field__native) {
    text-align: center;
    padding: 0 !important;
    font-weight: 600;
}

.qty-input :deep(.q-field__marginal) {
    height: 32px !important;
    min-height: 32px !important;
}

/* ====== Sticky no desktop ====== */
@media (min-width: 1024px) {
    .carrinho-col {
        position: sticky;
        top: 16px;
        align-self: flex-start;
        max-height: calc(100vh - 100px);
    }
}

/* ====== Dialog de pagamento ====== */
.letter-spacing {
    letter-spacing: 1px;
}

/* Mobile: dialog full-screen sem bordas */
@media (max-width: 599px) {
    .payment-card {
        border-radius: 0;
    }
}

/* Pequenos ajustes para telas muito pequenas */
@media (max-width: 599px) {
    .produtos-scroll {
        max-height: none;
    }

    .carrinho-items {
        max-height: none;
        min-height: 120px;
    }
}
</style>