<template>
    <q-page class="q-pa-sm q-pa-md-sm">
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
            <!-- COLUNA 1: Listagem de Produtos -->
            <div class="col-12 col-md-7">
                <q-card bordered class="no-shadow">
                    <q-card-section class="q-pb-none">
                        <q-input v-model="search" dense outlined placeholder="Buscar produto por nome...">
                            <template v-slot:prepend><q-icon name="search" /></template>
                            <template v-slot:append>
                                <q-icon v-if="search" name="clear" class="cursor-pointer" @click="search = ''" />
                            </template>
                        </q-input>
                    </q-card-section>
                    <q-separator class="q-my-sm" />
                    <q-list separator class="produtos-list">
                        <q-item v-for="prod in filteredProdutos" :key="prod.id" clickable
                            @click="adicionarAoCarrinho(prod)" :class="{ 'text-grey-5': prod.saldo_estoque <= 0 }">
                            <q-item-section>
                                <q-item-label class="text-weight-medium">{{ prod.nome }}</q-item-label>
                                <q-item-label caption>
                                    <span class="text-primary text-weight-bold">R$ {{ formatCurrency(prod.preco)
                                        }}</span>
                                    <span class="q-mx-xs">•</span>
                                    <span :class="prod.saldo_estoque > 0 ? 'text-positive' : 'text-negative'">
                                        Estoque: {{ prod.saldo_estoque }}
                                    </span>
                                </q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-btn color="primary" icon="add" round size="sm"
                                    @click.stop="adicionarAoCarrinho(prod)" :disable="prod.saldo_estoque <= 0" />
                            </q-item-section>
                        </q-item>
                        <q-item v-if="filteredProdutos.length === 0">
                            <q-item-section class="text-center text-grey-6 q-pa-md">Nenhum produto
                                encontrado.</q-item-section>
                        </q-item>
                    </q-list>
                </q-card>
            </div>

            <!-- COLUNA 2: Carrinho / Resumo do Pedido -->
            <div class="col-12 col-md-5">
                <q-card bordered class="no-shadow carrinho-card">
                    <q-card-section class="q-pb-sm">
                        <div class="text-h6 text-weight-bold flex items-center">
                            <q-icon name="shopping_cart" class="q-mr-sm" /> Pedido Atual
                        </div>
                    </q-card-section>
                    <q-separator />

                    <q-card-section class="q-py-sm">
                        <q-select v-model="clienteId" :options="clientesOptions" emit-value map-options outlined dense
                            label="Cliente (Opcional)" clearable placeholder="Consumidor Final" />
                    </q-card-section>

                    <q-card-section class="q-pt-none carrinho-items">
                        <q-list v-if="carrinho.length > 0" separator>
                            <q-item v-for="(item, index) in carrinho" :key="index" dense class="q-py-sm">
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">{{ item.nome }}</q-item-label>
                                    <q-item-label caption>{{ item.quantidade }} x R$ {{ formatCurrency(item.preco)
                                        }}</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <div class="row items-center no-wrap">
                                        <q-btn flat dense round icon="remove" size="sm" color="grey-7"
                                            @click="alterarQuantidade(index, -1)" />
                                        <div class="q-mx-sm text-weight-bold text-body1">{{ item.quantidade }}</div>
                                        <q-btn flat dense round icon="add" size="sm" color="primary"
                                            @click="alterarQuantidade(index, 1)" />
                                        <q-btn flat dense round icon="close" color="negative" size="sm" class="q-ml-sm"
                                            @click="removerDoCarrinho(index)" />
                                    </div>
                                </q-item-section>
                            </q-item>
                        </q-list>
                        <div v-else class="text-center text-grey-6 q-pa-xl">
                            <q-icon name="add_shopping_cart" size="48px" class="q-mb-sm text-grey-4" />
                            <div>Adicione produtos ao pedido</div>
                        </div>
                    </q-card-section>

                    <q-space />

                    <div class="carrinho-footer">
                        <q-separator />
                        <q-card-section>
                            <div class="row justify-between items-center">
                                <div class="text-h6 text-weight-medium">Total:</div>
                                <div class="text-h5 text-weight-bold text-primary">R$ {{ formatCurrency(totalPedido) }}
                                </div>
                            </div>
                        </q-card-section>
                        <q-card-section>
                            <q-btn color="positive" class="full-width" size="lg" icon="check_circle"
                                label="Finalizar Venda" :loading="saving" @click="abrirDialogPagamento"
                                :disable="carrinho.length === 0" />
                        </q-card-section>
                    </div>
                </q-card>
            </div>
        </div>

        <!-- DIÁLOGO DE FINALIZAÇÃO / PAGAMENTO -->
        <q-dialog v-model="dialogPagamento" persistent>
            <q-card style="min-width: 350px; max-width: 500px">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">Finalizar Venda</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-md q-gutter-md">
                    <div class="text-subtitle1 text-weight-bold">Total a Pagar: <span class="text-primary">R$ {{
                        formatCurrency(totalPedido) }}</span></div>

                    <q-separator class="q-my-md" />

                    <q-toggle v-model="pagarAgora" label="Pagar agora?" color="positive" class="text-weight-medium" />

                    <q-select v-if="pagarAgora" v-model="meioPagamentoSelecionado" :options="meioPagamentoOptions"
                        emit-value map-options outlined dense label="Meio de Pagamento *"
                        :rules="[val => pagarAgora ? !!val : true || 'Meio de pagamento é obrigatório']"
                        class="q-mt-md" />
                </q-card-section>

                <q-card-actions align="right" class="q-pa-md">
                    <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
                    <q-btn unelevated label="Confirmar Venda" color="positive" :loading="saving"
                        @click="confirmarVenda" />
                </q-card-actions>
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
const clienteId = ref(null)
const carrinho = ref([])

// Estado do Diálogo de Pagamento
const dialogPagamento = ref(false)
const pagarAgora = ref(false)
const meioPagamentoSelecionado = ref(null)

// --- Vue Query: Leituras ---
const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
        const response = await api.get('/produtos/')
        return response.data
    }
})

const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
        const response = await api.get('/clientes/')
        return response.data
    }
})

// --- Opções ---
const clientesOptions = computed(() => (clientes.value || []).map(c => ({ label: c.nome, value: c.id })))

const meioPagamentoOptions = [
    { label: 'Dinheiro', value: 'dinheiro' },
    { label: 'Pix', value: 'pix' },
    { label: 'Cartão de Débito', value: 'cartao_debito' },
    { label: 'Cartão de Crédito', value: 'cartao_credito' },
    { label: 'Outro', value: 'outro' }
]

// --- Computed ---
const filteredProdutos = computed(() => {
    const lista = produtos.value || []
    if (!search.value) return lista
    const term = search.value.toLowerCase()
    return lista.filter(p => p.nome.toLowerCase().includes(term) && p.ativo)
})

const totalPedido = computed(() => {
    return carrinho.value.reduce((acc, item) => acc + (item.preco * item.quantidade), 0)
})

// --- Métodos Auxiliares ---
const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0,00'
    return parseFloat(value).toFixed(2).replace('.', ',')
}

const adicionarAoCarrinho = (produto) => {
    if (produto.saldo_estoque <= 0) return
    const existente = carrinho.value.find(i => i.produto_id === produto.id)
    if (existente) {
        if (existente.quantidade < produto.saldo_estoque) {
            existente.quantidade++
        } else {
            $q.notify({ color: 'warning', message: 'Estoque insuficiente!', icon: 'warning' })
        }
    } else {
        carrinho.value.push({
            produto_id: produto.id, nome: produto.nome, preco: parseFloat(produto.preco),
            quantidade: 1, saldo_estoque: produto.saldo_estoque
        })
    }
}

const alterarQuantidade = (index, delta) => {
    const item = carrinho.value[index]
    const novaQtd = item.quantidade + delta
    if (novaQtd <= 0) { removerDoCarrinho(index); return }
    if (novaQtd > item.saldo_estoque) {
        $q.notify({ color: 'warning', message: 'Estoque máximo atingido!', icon: 'warning' }); return
    }
    item.quantidade = novaQtd
}

const removerDoCarrinho = (index) => { carrinho.value.splice(index, 1) }

// --- Ações de Pagamento ---
const abrirDialogPagamento = () => {
    pagarAgora.value = false
    meioPagamentoSelecionado.value = null
    dialogPagamento.value = true
}

const { mutateAsync: criarVenda, isPending: saving } = useMutation({
    mutationFn: async (payload) => {
        const response = await api.post('/pedidos/', payload)
        return response.data
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
    }
})

const confirmarVenda = async () => {
    if (pagarAgora.value && !meioPagamentoSelecionado.value) {
        $q.notify({ color: 'warning', message: 'Selecione o meio de pagamento.', icon: 'warning' })
        return
    }

    saving.value = true
    try {
        const payload = {
            cliente: clienteId.value,
            status: 'criado',
            itens: carrinho.value.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
            // Novos campos enviados para o backend
            pagar_agora: pagarAgora.value,
            meio_pagamento: pagarAgora.value ? meioPagamentoSelecionado.value : null
        }

        await criarVenda(payload)

        $q.notify({ color: 'positive', message: 'Venda finalizada com sucesso!', icon: 'check', timeout: 3000 })

        // Resetar estado
        carrinho.value = []
        clienteId.value = null
        dialogPagamento.value = false

    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.itens?.[0] || data?.non_field_errors?.[0] || 'Erro ao finalizar venda'
        $q.notify({ color: 'negative', message: errorMsg, icon: 'error', timeout: 6000 })
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
.page-header {
    min-height: 40px;
}

.produtos-list {
    max-height: 65vh;
    overflow-y: auto;
}

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

@media (min-width: 1024px) {
    .carrinho-card {
        position: sticky;
        top: 16px;
        max-height: calc(100vh - 100px);
    }
}
</style>