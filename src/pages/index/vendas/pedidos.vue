<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Vendas" icon="point_of_sale" to="/vendas" />
            <q-breadcrumbs-el label="Pedidos" icon="receipt_long" />
        </q-breadcrumbs>

        <!-- Cabeçalho -->
        <div class="row items-center q-mb-md page-header">
            <div>
                <div class="text-h5 text-weight-bold">Pedidos de Venda</div>
                <div class="text-caption text-grey-7">Gestão de encomendas, artigos e estados de processamento</div>
            </div>
            <q-space />
            <q-btn color="primary" icon="add" label="Novo Pedido" no-caps @click="openDialog()"
                class="q-ml-sm new-order-btn" :class="$q.screen.lt.sm ? 'full-width q-mt-sm' : ''" />
        </div>

        <!-- Barra de Pesquisa -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm">
                <q-input v-model="search" dense outlined placeholder="Pesquisar por cliente ou nº do pedido..."
                    class="col-12 col-sm-8 col-md-6">
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                    <template #append>
                        <q-icon v-if="search" name="clear" class="cursor-pointer" @click="search = ''" />
                    </template>
                </q-input>
            </q-card-section>
        </q-card>

        <!-- Tabela de Pedidos -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredPedidos" :columns="columns" row-key="id" :loading="loading" dense flat
                :pagination="{ rowsPerPage: 10 }" separator="horizontal" class="full-width">

                <template #body-cell-valor_total="props">
                    <q-td :props="props" class="text-weight-bold text-right">
                        R$ {{ formatCurrency(props.row.valor_total) }}
                    </q-td>
                </template>

                <template #body-cell-status="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="getStatusColor(props.row.status)" class="q-pa-xs">
                            {{ formatStatus(props.row.status) }}
                        </q-badge>
                    </q-td>
                </template>

                <template #body-cell-criado_em="props">
                    <q-td :props="props" class="text-grey-7">
                        {{ formatDate(props.row.criado_em) }}
                    </q-td>
                </template>

                <template #body-cell-acoes="props">
                    <q-td :props="props" class="text-center">
                        <q-btn flat round color="secondary" icon="receipt" size="sm" @click="gerenciarItens(props.row)">
                            <q-tooltip>Ver recibo/itens</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="primary" icon="edit" size="sm" @click="openDialog(props.row)">
                            <q-tooltip>Editar pedido</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)">
                            <q-tooltip>Eliminar</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- DIÁLOGO COM STEPPER (NOVO / EDITAR PEDIDO) -->
        <q-dialog v-model="dialog" persistent maximized>
            <q-card class="column no-wrap">
                <q-card-section class="row items-center no-wrap bg-primary text-white q-py-sm q-px-md">
                    <q-icon :name="isEditing ? 'edit' : 'shopping_cart'" size="28px" class="q-mr-sm" />
                    <div>
                        <div class="text-h6">{{ isEditing ? 'Editar Pedido #' + form.id : 'Novo Pedido de Venda' }}
                        </div>
                        <div class="text-caption text-white" style="opacity: .85">
                            {{ isEditing ? 'Altere o cliente ou estado do pedido' : `Siga os passos para registar o
                            pedido` }}
                        </div>
                    </div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup color="white" :disable="saving" />
                </q-card-section>

                <q-card-section class="col scroll q-pa-none">
                    <!-- Edição rápida -->
                    <div v-if="isEditing" class="q-pa-md">
                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-7">
                                <q-select v-model="form.cliente" :options="clientesOptions" emit-value map-options
                                    outlined dense label="Cliente" clearable placeholder="Consumidor Final"
                                    :disable="saving">
                                    <template #prepend>
                                        <q-icon name="person" />
                                    </template>
                                </q-select>
                            </div>
                            <div class="col-12 col-sm-5">
                                <q-select v-model="form.status" :options="statusOptions" emit-value map-options outlined
                                    dense label="Estado *" :rules="[val => !!val || 'Estado é obrigatório']"
                                    :disable="saving">
                                    <template #prepend>
                                        <q-icon name="flag" />
                                    </template>
                                </q-select>
                            </div>
                        </div>
                        <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mt-md">
                            <template #avatar>
                                <q-icon name="info" color="blue-9" />
                            </template>
                            Para editar os artigos de um pedido já criado, utilize a opção "Ver recibo/itens".
                        </q-banner>
                    </div>

                    <!-- Criar pedido em assistente (Stepper) -->
                    <q-stepper v-else v-model="step" header-nav color="primary" animated flat class="full-height">
                        <!-- ETAPA 1: Cliente -->
                        <q-step :name="1" title="Cliente" icon="person" :done="step > 1">
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Identificação do Cliente</div>
                            <div class="text-caption text-grey-7 q-mb-md">
                                Selecione um cliente registado ou avance para realizar uma venda direta ao Consumidor
                                Final.
                            </div>

                            <q-select v-model="form.cliente" :options="clientesFiltrados" use-input hide-selected
                                fill-input input-debounce="200" @filter="filterClientes" emit-value map-options outlined
                                dense clearable label="Cliente (Opcional)" placeholder="Consumidor Final">
                                <template #prepend>
                                    <q-icon name="person" />
                                </template>
                            </q-select>

                            <q-banner dense rounded class="bg-grey-2 text-grey-8 q-mt-lg">
                                <template #avatar>
                                    <q-icon name="info" color="primary" />
                                </template>
                                Se o cliente não for selecionado, a venda será associada ao Consumidor Final.
                            </q-banner>
                        </q-step>

                        <!-- ETAPA 2: Artigos & Stock -->
                        <q-step :name="2" title="Artigos & Stock" icon="inventory_2" :done="step > 2">
                            <div class="row q-col-gutter-md">
                                <div class="col-12 col-md-7">
                                    <div class="text-subtitle1 text-weight-bold q-mb-sm">Adicionar Produtos</div>
                                    <q-card flat bordered class="q-mb-md">
                                        <q-card-section class="q-pa-md">
                                            <div class="row q-col-gutter-sm items-end">
                                                <div class="col-12 col-sm-7">
                                                    <q-select v-model="tempItem.produto_id" :options="produtosFiltrados"
                                                        use-input hide-selected fill-input input-debounce="200"
                                                        @filter="filterProdutos" emit-value map-options outlined dense
                                                        label="Produto *" @update:model-value="onProdutoSelecionado">
                                                        <template #prepend>
                                                            <q-icon name="search" />
                                                        </template>
                                                    </q-select>
                                                </div>
                                                <div class="col-6 col-sm-3">
                                                    <q-input v-model.number="tempItem.quantidade" type="number" min="1"
                                                        outlined dense label="Qtd" />
                                                </div>
                                                <div class="col-6 col-sm-2">
                                                    <q-btn color="primary" icon="add" class="full-width" unelevated
                                                        :disable="!tempItem.produto_id || tempItem.quantidade < 1"
                                                        @click="addItem" />
                                                </div>
                                            </div>

                                            <!-- Indicador Visual de Stock -->
                                            <div v-if="selectedProdutoInfo" class="row items-center q-mt-sm">
                                                <q-badge :color="getStockBadgeColor(selectedProdutoInfo.saldo_estoque)"
                                                    class="q-mr-sm">
                                                    Stock: {{ selectedProdutoInfo.saldo_estoque }} un
                                                </q-badge>
                                                <span class="text-caption text-grey-7">
                                                    Preço un.: R$ {{ formatCurrency(selectedProdutoInfo.preco) }}
                                                </span>
                                            </div>
                                        </q-card-section>
                                    </q-card>

                                    <!-- Lista de Itens Selecionados -->
                                    <div class="text-subtitle2 text-weight-bold q-mb-xs">Itens do Pedido</div>
                                    <q-list v-if="form.itens.length" separator bordered class="rounded-borders">
                                        <q-item v-for="(item, idx) in form.itens" :key="idx">
                                            <q-item-section avatar>
                                                <q-avatar color="primary" text-color="white" size="32px">
                                                    {{ item.quantidade }}
                                                </q-avatar>
                                            </q-item-section>
                                            <q-item-section>
                                                <q-item-label class="text-weight-medium">{{
                                                    getProdutoNome(item.produto_id)
                                                    }}</q-item-label>
                                                <q-item-label caption>
                                                    R$ {{ formatCurrency(getProdutoPreco(item.produto_id)) }} un
                                                </q-item-label>
                                            </q-item-section>
                                            <q-item-section side>
                                                <div class="text-weight-bold text-primary">
                                                    R$ {{ formatCurrency(item.quantidade *
                                                        getProdutoPreco(item.produto_id)) }}
                                                </div>
                                            </q-item-section>
                                            <q-item-section side>
                                                <q-btn flat round color="negative" icon="delete" size="sm"
                                                    @click="removeItem(idx)" />
                                            </q-item-section>
                                        </q-item>
                                    </q-list>
                                    <div v-else
                                        class="text-caption text-grey-6 q-pa-md text-center border-dashed rounded-borders">
                                        Nenhum produto adicionado ao pedido.
                                    </div>
                                </div>

                                <!-- Resumo Lateral -->
                                <div class="col-12 col-md-5">
                                    <q-card flat bordered>
                                        <q-card-section>
                                            <div class="text-subtitle2 text-weight-bold q-mb-sm">Resumo da Encomenda
                                            </div>
                                            <q-separator class="q-mb-md" />

                                            <div class="row justify-between q-mb-xs text-body2">
                                                <span>Cliente:</span>
                                                <span class="text-weight-medium">{{ getClienteNome(form.cliente)
                                                    }}</span>
                                            </div>
                                            <div class="row justify-between q-mb-xs text-body2">
                                                <span>Total de Itens:</span>
                                                <span class="text-weight-medium">{{ form.itens.length }}</span>
                                            </div>
                                            <q-separator class="q-my-md" />
                                            <div class="row justify-between items-center">
                                                <span class="text-subtitle1 text-weight-bold">Total:</span>
                                                <span class="text-h5 text-weight-bold text-primary">
                                                    R$ {{ formatCurrency(valorTotalPedido) }}
                                                </span>
                                            </div>
                                        </q-card-section>
                                    </q-card>
                                </div>
                            </div>
                        </q-step>

                        <!-- ETAPA 3: Confirmação -->
                        <q-step :name="3" title="Confirmação" icon="check_circle">
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Revisão e Conclusão</div>
                            <div class="text-caption text-grey-7 q-mb-md">
                                Confirme os detalhes do pedido antes de finalizar.
                            </div>

                            <q-card flat bordered class="q-pa-md q-mb-md">
                                <div class="row q-col-gutter-md">
                                    <div class="col-12 col-sm-6">
                                        <div class="text-caption text-grey-7">Cliente</div>
                                        <div class="text-body1 text-weight-medium">{{ getClienteNome(form.cliente) }}
                                        </div>
                                    </div>
                                    <div class="col-12 col-sm-6">
                                        <div class="text-caption text-grey-7">Estado Inicial</div>
                                        <q-badge color="grey-7" class="q-pa-xs">Criado</q-badge>
                                    </div>
                                    <div class="col-12">
                                        <div class="text-caption text-grey-7">Valor Total do Pedido</div>
                                        <div class="text-h4 text-weight-bold text-primary">
                                            R$ {{ formatCurrency(valorTotalPedido) }}
                                        </div>
                                    </div>
                                </div>
                            </q-card>
                        </q-step>
                    </q-stepper>
                </q-card-section>

                <q-separator />
                <q-card-section class="q-pa-md">
                    <div class="row justify-between items-center">
                        <div>
                            <q-btn v-if="!isEditing && step > 1" flat label="Voltar" color="grey-7" @click="step--" />
                        </div>
                        <div class="row q-col-gutter-sm">
                            <q-btn flat label="Cancelar" color="grey-7" v-close-popup :disable="saving" />
                            <q-btn v-if="!isEditing && step < 3" color="primary" label="Avançar" @click="avancarStep" />
                            <q-btn v-else color="positive" icon="check"
                                :label="isEditing ? 'Salvar' : 'Concluir Pedido'" :loading="saving"
                                @click="savePedido" />
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </q-dialog>

        <!-- COMPROVANTE -->
        <PedidoReceiptDialog v-model="receiptDialog" :pedido-id="selectedPedidoId" />
    </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import PedidoReceiptDialog from '@/components/pedidos/PedidoReceiptDialog.vue'

const $q = useQuasar()
const queryClient = useQueryClient()

const search = ref('')
const dialog = ref(false)
const isEditing = ref(false)
const step = ref(1)

const receiptDialog = ref(false)
const selectedPedidoId = ref(null)

const defaultForm = {
    id: null,
    cliente: null,
    status: 'criado',
    itens: []
}
const form = ref({ ...defaultForm })

const tempItem = ref({ produto_id: null, quantidade: 1 })
const selectedProdutoInfo = ref(null)

const statusOptions = [
    { label: 'Criado', value: 'criado' },
    { label: 'Processando', value: 'processando' },
    { label: 'Concluído', value: 'concluido' },
    { label: 'Cancelado', value: 'cancelado' }
]

const columns = [
    { name: 'id', label: 'Nº', field: 'id', align: 'center', sortable: true },
    { name: 'cliente_nome', label: 'Cliente', field: row => row.cliente?.nome || row.cliente_nome || 'Consumidor Final', align: 'left', sortable: true },
    { name: 'criado_em', label: 'Data', field: 'criado_em', align: 'left', sortable: true },
    { name: 'quantidade_total', label: 'Itens', field: 'quantidade_total', align: 'center', sortable: true },
    { name: 'valor_total', label: 'Valor Total', field: 'valor_total', align: 'right', sortable: true },
    { name: 'status', label: 'Estado', field: 'status', align: 'center', sortable: true },
    { name: 'acoes', label: 'Ações', align: 'center' }
]

// VUE QUERY
const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => (await api.get('/clientes/')).data
})

const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => (await api.get('/produtos/')).data
})

const { data: pedidos, isLoading: loading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => (await api.get('/pedidos/')).data
})

// FILTROS
const clientesOptions = computed(() => (clientes.value || []).map(c => ({ label: c.nome, value: c.id })))
const clientesFiltrados = ref([])
const filterClientes = (val, update) => {
    update(() => {
        const termo = (val || '').toLowerCase().trim()
        if (!termo) { clientesFiltrados.value = clientesOptions.value; return }
        clientesFiltrados.value = clientesOptions.value.filter(opt => opt.label.toLowerCase().includes(termo))
    })
}

const produtosOptions = computed(() => (produtos.value || []).map(p => ({ label: p.nome, value: p.id })))
const produtosFiltrados = ref([])
const filterProdutos = (val, update) => {
    update(() => {
        const termo = (val || '').toLowerCase().trim()
        if (!termo) { produtosFiltrados.value = produtosOptions.value; return }
        produtosFiltrados.value = produtosOptions.value.filter(opt => opt.label.toLowerCase().includes(termo))
    })
}

const filteredPedidos = computed(() => {
    const lista = pedidos.value || []
    if (!search.value) return lista
    const term = search.value.toLowerCase()
    return lista.filter(p =>
        p.id.toString().includes(term) ||
        (p.cliente?.nome && p.cliente.nome.toLowerCase().includes(term))
    )
})

const valorTotalPedido = computed(() => {
    return (form.value.itens || []).reduce((sum, i) => sum + (i.quantidade * getProdutoPreco(i.produto_id)), 0)
})

// MÉTODOS AUXILIARES
const getClienteNome = (id) => {
    if (!id) return 'Consumidor Final'
    const c = (clientes.value || []).find(item => item.id === id)
    return c ? c.nome : 'Consumidor Final'
}

const getProdutoNome = (id) => {
    const p = (produtos.value || []).find(item => item.id === id)
    return p ? p.nome : `Produto #${id}`
}

const getProdutoPreco = (id) => {
    const p = (produtos.value || []).find(item => item.id === id)
    return p ? parseFloat(p.preco) : 0
}

const getStockBadgeColor = (saldo) => {
    if (!saldo || saldo <= 0) return 'negative'
    if (saldo <= 5) return 'warning'
    return 'positive'
}

const formatCurrency = (val) => (!val || isNaN(val) ? '0,00' : parseFloat(val).toFixed(2).replace('.', ','))
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '-')
const formatStatus = (s) => (statusOptions.find(opt => opt.value === s)?.label || s)
const getStatusColor = (s) => ({ criado: 'grey-7', processando: 'warning', concluido: 'positive', cancelado: 'negative' }[s] || 'grey')

const onProdutoSelecionado = (id) => {
    selectedProdutoInfo.value = (produtos.value || []).find(p => p.id === id) || null
}

const addItem = () => {
    if (!tempItem.value.produto_id || tempItem.value.quantidade < 1) return
    const prod = (produtos.value || []).find(p => p.id === tempItem.value.produto_id)
    if (prod && prod.saldo_estoque < tempItem.value.quantidade) {
        $q.notify({ color: 'warning', message: `Stock insuficiente. Disponível: ${prod.saldo_estoque}`, icon: 'warning' })
        return
    }
    form.value.itens.push({ ...tempItem.value })
    tempItem.value = { produto_id: null, quantidade: 1 }
    selectedProdutoInfo.value = null
}

const removeItem = (idx) => { form.value.itens.splice(idx, 1) }

const openDialog = (pedido = null) => {
    step.value = 1
    if (pedido) {
        isEditing.value = true
        form.value = { id: pedido.id, cliente: pedido.cliente?.id || pedido.cliente, status: pedido.status, itens: [] }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm, itens: [] }
    }
    dialog.value = true
}

const avancarStep = () => {
    if (step.value === 2 && form.value.itens.length === 0) {
        $q.notify({ color: 'warning', message: 'Adicione pelo menos um produto.', icon: 'warning' })
        return
    }
    step.value++
}

const { mutateAsync: savePedidoMutation, isPending: saving } = useMutation({
    mutationFn: async ({ payload, editing, id }) => editing
        ? (await api.put(`/pedidos/${id}/`, payload)).data
        : (await api.post('/pedidos/', payload)).data,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['pedidos'] })
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
        queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
    }
})

const savePedido = async () => {
    try {
        const payload = { cliente: form.value.cliente, status: form.value.status }
        if (!isEditing.value) payload.itens = form.value.itens
        await savePedidoMutation({ payload, editing: isEditing.value, id: form.value.id })
        $q.notify({ color: 'positive', message: 'Pedido guardado com sucesso!', icon: 'check' })
        dialog.value = false
    } catch (error) {
        $q.notify({ color: 'negative', message: error.response?.data?.detail || 'Erro ao guardar pedido', icon: 'error' })
    }
}

const { mutateAsync: deletePedidoMutation } = useMutation({
    mutationFn: async (id) => api.delete(`/pedidos/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pedidos'] }) }
})

const confirmDelete = (pedido) => {
    $q.dialog({
        title: 'Eliminar Pedido?',
        message: `Deseja eliminar o pedido #${pedido.id}?`,
        cancel: true, persistent: true
    }).onOk(async () => {
        await deletePedidoMutation(pedido.id)
    })
}

const gerenciarItens = (pedido) => {
    selectedPedidoId.value = pedido.id
    receiptDialog.value = true
}
</script>

<style scoped>
.border-dashed {
    border: 1px dashed #ccc;
}
</style>