<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Vendas" icon="point_of_sale" to="/vendas" />
            <q-breadcrumbs-el label="Pedidos" icon="receipt_long" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md q-col-gutter-sm">
            <div class="col-12 col-sm">
                <div class="text-h5 text-weight-bold">Pedidos de Venda</div>
            </div>
            <div class="col-12 col-sm-auto">
                <q-btn color="primary" icon="add" label="Novo Pedido" no-caps @click="openDialog()"
                    :class="$q.screen.lt.sm ? 'full-width' : ''" />
            </div>
        </div>

        <!-- Barra de Ferramentas (Busca) -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm">
                <q-input v-model="search" dense outlined placeholder="Buscar por cliente ou nº do pedido..."
                    class="col-12 col-sm-8 col-md-6">
                    <template v-slot:prepend>
                        <q-icon name="search" />
                    </template>
                    <template v-slot:append>
                        <q-icon v-if="search" name="clear" class="cursor-pointer" @click="search = ''" />
                    </template>
                </q-input>
            </q-card-section>
        </q-card>

        <!-- Tabela de Pedidos -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredPedidos" :columns="columns" row-key="id" :loading="loading"
                :pagination="{ rowsPerPage: 10 }" flat class="full-width">

                <template v-slot:body-cell-valor_total="props">
                    <q-td :props="props" class="text-weight-medium text-right">
                        R$ {{ formatCurrency(props.row.valor_total) }}
                    </q-td>
                </template>

                <template v-slot:body-cell-status="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="getStatusColor(props.row.status)" class="text-body2 q-pa-sm">
                            {{ formatStatus(props.row.status) }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-criado_em="props">
                    <q-td :props="props" class="text-grey-7">
                        {{ formatDate(props.row.criado_em) }}
                    </q-td>
                </template>

                <template v-slot:body-cell-acoes="props">
                    <q-td :props="props" class="text-center">
                        <q-btn flat round color="secondary" icon="list" size="sm" @click="gerenciarItens(props.row)">
                            <q-tooltip>Ver itens do pedido</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="primary" icon="edit" size="sm" @click="openDialog(props.row)">
                            <q-tooltip>Editar Status/Cliente</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)">
                            <q-tooltip>Excluir</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- ============================================ -->
        <!-- DIÁLOGO: NOVO / EDITAR PEDIDO                -->
        <!-- ============================================ -->
        <q-dialog v-model="dialog" persistent maximized>
            <q-card class="column no-wrap">
                <q-card-section class="row items-center no-wrap bg-primary text-white q-py-sm q-px-md">
                    <q-icon :name="isEditing ? 'edit' : 'add_shopping_cart'" size="28px" class="q-mr-sm" />
                    <div>
                        <div class="text-h6">{{ isEditing ? 'Editar Pedido' : 'Novo Pedido' }}</div>
                        <div class="text-caption text-white" style="opacity: .85">
                            {{ isEditing ? 'Altere cliente e status do pedido' : 'Preencha os dados e adicione os itens'
                            }}
                        </div>
                    </div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup color="white" :disable="saving" />
                </q-card-section>

                <q-form @submit="savePedido" class="col column no-wrap">
                    <q-card-section class="col scroll q-pa-md">
                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-8">
                                <q-select v-model="form.cliente" :options="clientesOptions" emit-value map-options
                                    outlined dense label="Cliente *" :rules="[val => !!val || 'Cliente é obrigatório']"
                                    :disable="saving">
                                    <template #prepend>
                                        <q-icon name="person" />
                                    </template>
                                </q-select>
                            </div>
                            <div class="col-12 col-sm-4">
                                <q-select v-model="form.status" :options="statusOptions" emit-value map-options outlined
                                    dense label="Status *" :rules="[val => !!val || 'Status é obrigatório']"
                                    :disable="saving">
                                    <template #prepend>
                                        <q-icon name="flag" />
                                    </template>
                                </q-select>
                            </div>
                        </div>

                        <template v-if="!isEditing">
                            <q-separator class="q-my-lg" />

                            <div class="row items-center q-mb-md">
                                <q-icon name="shopping_basket" color="primary" size="24px" class="q-mr-sm" />
                                <div class="text-subtitle1 text-weight-bold">Itens do Pedido</div>
                                <q-space />
                                <q-badge v-if="form.itens.length" color="primary" class="q-pa-xs"
                                    :label="`${form.itens.length} ${form.itens.length === 1 ? 'item' : 'itens'}`" />
                            </div>

                            <q-card flat bordered class="q-mb-md">
                                <q-card-section class="q-pa-md">
                                    <div class="text-caption text-weight-medium q-mb-sm">
                                        ADICIONAR ITEM
                                    </div>
                                    <div class="row q-col-gutter-sm items-end">
                                        <div class="col-12 col-sm-6">
                                            <q-select v-model="tempItem.produto_id" :options="produtosOptions"
                                                emit-value map-options outlined dense label="Produto" :disable="saving">
                                                <template #prepend>
                                                    <q-icon name="inventory_2" />
                                                </template>
                                            </q-select>
                                        </div>
                                        <div class="col-6 col-sm-3">
                                            <q-input v-model.number="tempItem.quantidade" type="number" min="1" outlined
                                                dense label="Qtd" :disable="saving">
                                                <template #prepend>
                                                    <q-icon name="numbers" />
                                                </template>
                                            </q-input>
                                        </div>
                                        <div class="col-6 col-sm-3">
                                            <q-btn color="primary" icon="add" label="Adicionar" no-caps
                                                class="full-width" unelevated
                                                :disable="!tempItem.produto_id || tempItem.quantidade < 1 || saving"
                                                @click="addItem" />
                                        </div>
                                    </div>

                                    <transition appear enter-active-class="animated fadeIn"
                                        leave-active-class="animated fadeOut">
                                        <div v-if="tempItem.produto_id && tempItem.quantidade >= 1"
                                            class="row items-center q-mt-md q-px-sm">
                                            <q-icon name="calculate" color="primary" size="18px" class="q-mr-xs" />
                                            <div class="text-caption text-grey-7 q-mr-sm">Subtotal deste item:</div>
                                            <div class="text-weight-bold text-primary">
                                                R$ {{ formatCurrency(tempItem.quantidade *
                                                    getProdutoPreco(tempItem.produto_id)) }}
                                            </div>
                                        </div>
                                    </transition>
                                </q-card-section>
                            </q-card>

                            <transition-group name="list" tag="div" appear enter-active-class="animated fadeInDown"
                                leave-active-class="animated fadeOutUp">
                                <q-card v-for="(item, index) in form.itens" :key="`${item.produto_id}-${index}`" flat
                                    bordered class="q-mb-sm">
                                    <q-card-section class="row items-center no-wrap q-py-sm q-px-md">
                                        <q-avatar color="primary" text-color="white" size="44px" class="q-mr-md">
                                            <div class="text-weight-bold">{{ item.quantidade }}x</div>
                                        </q-avatar>
                                        <div class="col ellipsis q-pr-sm">
                                            <div class="text-weight-medium ellipsis">
                                                {{ getProdutoNome(item.produto_id) }}
                                            </div>
                                            <div class="text-caption text-grey-7">
                                                R$ {{ formatCurrency(getProdutoPreco(item.produto_id)) }} / unidade
                                            </div>
                                        </div>
                                        <div class="text-right q-mr-md">
                                            <div class="text-weight-bold text-primary">
                                                R$ {{ formatCurrency(item.quantidade *
                                                    getProdutoPreco(item.produto_id)) }}
                                            </div>
                                        </div>
                                        <q-btn flat round color="negative" icon="delete_outline" size="sm"
                                            :disable="saving" @click="removeItem(index)">
                                            <q-tooltip>Remover item</q-tooltip>
                                        </q-btn>
                                    </q-card-section>
                                </q-card>
                            </transition-group>

                            <q-banner v-if="form.itens.length === 0" dense rounded class="bg-grey-2 text-grey-8">
                                <template #avatar>
                                    <q-icon name="info" />
                                </template>
                                Nenhum item adicionado ainda. Use o formulário acima para incluir produtos.
                            </q-banner>
                        </template>

                        <q-banner v-else dense rounded class="bg-blue-1 text-blue-9 q-mt-md">
                            <template #avatar>
                                <q-icon name="info" color="blue-9" />
                            </template>
                            Para alterar os itens deste pedido, use a ação
                            <strong>"Gerenciar Itens"</strong> na lista de pedidos.
                        </q-banner>

                        <q-banner v-if="!isEditing" dense rounded class="bg-orange-1 text-orange-9 q-mt-md">
                            <template #avatar>
                                <q-icon name="warning" color="orange-9" />
                            </template>
                            O valor total e a baixa no estoque serão processados automaticamente ao criar o pedido.
                        </q-banner>
                    </q-card-section>

                    <q-separator />
                    <q-card-section class="q-pa-md">
                        <div class="row items-center q-col-gutter-sm">
                            <div v-if="!isEditing" class="col-12 col-sm">
                                <div class="text-caption text-grey-7">Total do pedido</div>
                                <div class="text-h5 text-weight-bold text-primary">
                                    R$ {{ formatCurrency(valorTotalPedido) }}
                                </div>
                            </div>
                            <div v-else class="col-12 col-sm">
                                <div class="text-caption text-grey-7">Pedido #{{ form.id }}</div>
                                <div class="text-subtitle1 text-weight-medium">Editando dados básicos</div>
                            </div>

                            <div class="col-12 col-sm-auto">
                                <div class="row q-col-gutter-sm justify-end">
                                    <div class="col-12 col-sm-auto">
                                        <q-btn class="full-width" flat color="grey-7" label="Cancelar" no-caps
                                            v-close-popup :disable="saving" />
                                    </div>
                                    <div class="col-12 col-sm-auto">
                                        <q-btn class="full-width" unelevated color="primary" no-caps
                                            :label="isEditing ? 'Salvar alterações' : 'Criar pedido'"
                                            :icon="isEditing ? 'save' : 'check_circle'" type="submit"
                                            :loading="saving" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </q-card-section>
                </q-form>
            </q-card>
        </q-dialog>

        <!-- ============================================ -->
        <!-- DIÁLOGO: COMPROVANTE (PAPEL TÉRMICO)         -->
        <!-- ============================================ -->
        <q-dialog v-model="receiptDialog" maximized transition-show="fade" transition-hide="fade"
            @hide="selectedPedidoId = null">
            <q-card class="column no-wrap receipt-dialog-card">
                <!-- HEADER FIXO (chrome da UI, mantém azul) -->
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
                    <!-- Loading -->
                    <div v-if="loadingDetalhes" class="text-center q-pa-xl">
                        <q-spinner color="primary" size="50px" />
                        <div class="text-grey-7 q-mt-md">Carregando comprovante...</div>
                    </div>

                    <!-- Erro -->
                    <div v-else-if="!pedidoDetalhes" class="text-center q-pa-xl text-grey-7">
                        <q-icon name="error_outline" size="60px" />
                        <div class="q-mt-md">Não foi possível carregar os detalhes do pedido.</div>
                    </div>

                    <!-- CUPOM (papel térmico) -->
                    <div v-else class="receipt-paper">
                        <!-- Cabeçalho -->
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
                            <div class="receipt-value">{{ nomeCliente(pedidoDetalhes) }}</div>
                        </div>

                        <div class="receipt-block">
                            <div class="receipt-label">DATA / HORA</div>
                            <div class="receipt-value">{{ formatDate(pedidoDetalhes.criado_em) }}</div>
                        </div>

                        <div class="receipt-divider">--------------------------------</div>

                        <div class="receipt-label q-mb-sm">ITENS</div>

                        <div v-if="pedidoDetalhes.itens && pedidoDetalhes.itens.length">
                            <div v-for="(item, index) in pedidoDetalhes.itens" :key="index" class="receipt-item">
                                <div class="receipt-item-name">{{ nomeProdutoItem(item) }}</div>
                                <div class="receipt-row receipt-item-calc">
                                    <span>{{ item.quantidade }} x {{ formatCurrency(precoItem(item)) }}</span>
                                    <span>{{ formatCurrency(subtotalItem(item)) }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="receipt-muted text-center q-pa-md">
                            Nenhum item neste pedido.
                        </div>

                        <div class="receipt-divider">--------------------------------</div>

                        <div class="receipt-row">
                            <span>QTD. TOTAL</span>
                            <span>{{ pedidoDetalhes.quantidade_total ?? pedidoDetalhes.itens?.length ?? 0 }}</span>
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
                            <q-btn class="full-width" flat color="grey-7" icon="print" label="Imprimir" no-caps
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
const dialog = ref(false)
const isEditing = ref(false)

// Estado do comprovante
const receiptDialog = ref(false)
const selectedPedidoId = ref(null)

const defaultForm = {
    id: null,
    cliente: null,
    status: 'criado',
    itens: []
}
const form = ref({ ...defaultForm })

const tempItem = ref({
    produto_id: null,
    quantidade: 1,
    observacao: ''
})

// --- Opções ---
const statusOptions = [
    { label: 'Criado', value: 'criado' },
    { label: 'Processando', value: 'processando' },
    { label: 'Concluído', value: 'concluido' },
    { label: 'Cancelado', value: 'cancelado' }
]

const clientesOptions = computed(() => {
    return (clientes.value || []).map(c => ({ label: c.nome, value: c.id }))
})

const produtosOptions = computed(() => {
    return (produtos.value || []).map(p => ({
        label: `${p.nome} (Saldo: ${p.saldo_estoque ?? '?'})`,
        value: p.id
    }))
})

// --- Vue Query: Leituras ---
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

// Query sob demanda: detalhes de UM pedido
const { data: pedidoDetalhes, isLoading: loadingDetalhes } = useQuery({
    queryKey: ['pedido-detalhes', selectedPedidoId],
    queryFn: async () => {
        const response = await api.get(`/pedidos/${selectedPedidoId.value}/`)
        return response.data
    },
    enabled: computed(() => !!selectedPedidoId.value)
})

// --- Colunas da Tabela ---
const columns = [
    { name: 'id', label: 'Nº', field: 'id', align: 'center', sortable: true },
    { name: 'cliente_nome', label: 'Cliente', field: row => row.cliente?.nome || row.cliente_nome || `ID: ${row.cliente}`, align: 'left', sortable: true },
    { name: 'criado_em', label: 'Data', field: 'criado_em', align: 'left', sortable: true },
    { name: 'quantidade_total', label: 'Itens', field: 'quantidade_total', align: 'center', sortable: true },
    { name: 'valor_total', label: 'Valor Total', field: 'valor_total', align: 'right', sortable: true },
    { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
    { name: 'acoes', label: 'Ações', align: 'center' }
]

// --- Computed ---
const filteredPedidos = computed(() => {
    const lista = pedidos.value || []
    if (!search.value) return lista
    const term = search.value.toLowerCase()
    return lista.filter(p =>
        p.id.toString().includes(term) ||
        (p.cliente?.nome && p.cliente.nome.toLowerCase().includes(term)) ||
        (p.cliente_nome && p.cliente_nome.toLowerCase().includes(term))
    )
})

const valorTotalPedido = computed(() => {
    return (form.value.itens || []).reduce((sum, item) => {
        return sum + (item.quantidade * getProdutoPreco(item.produto_id))
    }, 0)
})

const valorTotalDetalhes = computed(() => {
    if (!pedidoDetalhes.value) return 0
    if (pedidoDetalhes.value.valor_total != null) {
        return parseFloat(pedidoDetalhes.value.valor_total)
    }
    return (pedidoDetalhes.value.itens || []).reduce(
        (sum, item) => sum + subtotalItem(item),
        0
    )
})

// --- Métodos Auxiliares ---
const getProdutoNome = (produtoId) => {
    const prod = (produtos.value || []).find(p => p.id === produtoId)
    return prod ? prod.nome : `Produto ID: ${produtoId}`
}

const getProdutoPreco = (produtoId) => {
    const prod = (produtos.value || []).find(p => p.id === produtoId)
    return prod ? parseFloat(prod.preco) : 0
}

const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0,00'
    return parseFloat(value).toFixed(2).replace('.', ',')
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const formatStatus = (status) => {
    const found = statusOptions.find(s => s.value === status)
    return found ? found.label : status
}

const getStatusColor = (status) => {
    const colors = {
        criado: 'grey-7',
        processando: 'warning',
        concluido: 'positive',
        cancelado: 'negative'
    }
    return colors[status] || 'grey'
}

// --- Helpers do Comprovante ---
const nomeCliente = (pedido) => {
    if (!pedido) return '-'
    return pedido.cliente?.nome
        || pedido.cliente_nome
        || (typeof pedido.cliente === 'string' ? pedido.cliente : null)
        || 'Não informado'
}

const nomeProdutoItem = (item) => {
    return item.produto?.nome
        || item.produto_nome
        || getProdutoNome(item.produto_id ?? item.produto)
        || 'Produto'
}

const precoItem = (item) => {
    if (item.preco_unitario != null) return parseFloat(item.preco_unitario)
    if (item.preco != null) return parseFloat(item.preco)
    if (item.produto?.preco != null) return parseFloat(item.produto.preco)
    return getProdutoPreco(item.produto_id ?? item.produto?.id)
}

const subtotalItem = (item) => {
    if (item.subtotal != null) return parseFloat(item.subtotal)
    return (item.quantidade || 0) * precoItem(item)
}

// --- Lógica de Itens ---
const addItem = () => {
    if (!tempItem.value.produto_id || tempItem.value.quantidade < 1) {
        $q.notify({ color: 'warning', message: 'Selecione um produto e uma quantidade válida.', icon: 'warning' })
        return
    }
    form.value.itens.push({ ...tempItem.value })
    tempItem.value = { produto_id: null, quantidade: 1, observacao: '' }
}

const removeItem = (index) => {
    form.value.itens.splice(index, 1)
}

// --- Ações do Usuário ---
const openDialog = (pedido = null) => {
    if (pedido) {
        isEditing.value = true
        form.value = {
            id: pedido.id,
            cliente: pedido.cliente?.id || pedido.cliente,
            status: pedido.status,
            itens: []
        }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm, itens: [] }
        tempItem.value = { produto_id: null, quantidade: 1, observacao: '' }
    }
    dialog.value = true
}

const { mutateAsync: savePedidoMutation, isPending: saving } = useMutation({
    mutationFn: async ({ payload, editing, id }) => editing
        ? (await api.put(`/pedidos/${id}/`, payload)).data
        : (await api.post('/pedidos/', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos'] })
})

const savePedido = async () => {
    if (!isEditing.value && form.value.itens.length === 0) {
        $q.notify({ color: 'warning', message: 'Adicione pelo menos um item ao pedido.', icon: 'warning' })
        return
    }
    try {
        const payload = { cliente: form.value.cliente, status: form.value.status }
        if (!isEditing.value) payload.itens = form.value.itens
        await savePedidoMutation({ payload, editing: isEditing.value, id: form.value.id })
        $q.notify({
            color: 'positive',
            message: isEditing.value
                ? 'Pedido atualizado com sucesso!'
                : 'Pedido criado e estoque reservado com sucesso!',
            icon: 'check_circle'
        })
        dialog.value = false
    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.itens?.[0] || data?.non_field_errors?.[0] || 'Erro ao salvar pedido'
        $q.notify({ color: 'negative', message: errorMsg, icon: 'error', timeout: 5000 })
    }
}

const { mutateAsync: deletePedidoMutation } = useMutation({
    mutationFn: async (id) => api.delete(`/pedidos/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos'] })
})

const confirmDelete = (pedido) => {
    $q.dialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir o pedido #${pedido.id}? Esta ação não poderá ser desfeita e o estoque NÃO será reposto automaticamente.`,
        cancel: true,
        persistent: true
    }).onOk(async () => {
        try {
            await deletePedidoMutation(pedido.id)
            $q.notify({ color: 'positive', message: 'Pedido excluído com sucesso', icon: 'delete' })
        } catch (error) {
            $q.notify({
                color: 'negative',
                message: error.response?.data?.detail || 'Erro ao excluir pedido',
                icon: 'error'
            })
        }
    })
}

const gerenciarItens = (pedido) => {
    selectedPedidoId.value = pedido.id
    receiptDialog.value = true
}

// Impressão: abre uma janela só com o cupom (mesmo estilo térmico)
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
    setTimeout(() => { win.print(); win.close() }, 250)
}
</script>

<style scoped>
/* ====== Animações de lista ====== */
.list-enter-active,
.list-leave-active {
    transition: all 0.25s ease;
}

.list-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.list-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

.list-leave-active {
    position: absolute;
    width: 100%;
}

/* ====== Dialog do comprovante ====== */
.receipt-dialog-card {
    max-width: 640px;
    width: 100%;
    margin: auto;
    max-height: 90vh;
    overflow: hidden;
    border-radius: 8px;
}

/* Fundo do "ambiente" (mesa onde o papel está em cima) */
.receipt-bg {
    background: #e9e6dc;
}

/* ====== Papel térmico ====== */
.receipt-paper {
    background: #fdfbf3;
    /* off-white amarelado, cor de papel térmico */
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
    /* Cantos serrilhados no topo/base (efeito de papel térmico) */
    background-image:
        linear-gradient(45deg, transparent 33.333%, #e9e6dc 33.333%, #e9e6dc 66.667%, transparent 66.667%),
        linear-gradient(-45deg, transparent 33.333%, #e9e6dc 33.333%, #e9e6dc 66.667%, transparent 66.667%);
    background-size: 12px 24px;
    background-repeat: repeat-x;
    background-position: top center, bottom center;
}

/* Cabeçalho */
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

/* Linhas tracejadas literais (=, -) */
.receipt-divider {
    color: #555;
    font-size: 12px;
    margin: 8px 0;
    white-space: nowrap;
    overflow: hidden;
    letter-spacing: 0;
    text-align: center;
}

/* Linhas de dados (label ... valor) */
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

/* Itens */
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

/* Total em destaque (borda dupla em cima/baixo, estilo cupom) */
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

/* Rodapé */
.receipt-footer {
    text-align: center;
    font-size: 11px;
    color: #555;
    margin-top: 12px;
    letter-spacing: .5px;
}

/* Mobile: dialog full-screen */
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
        /* sem serrilhado no mobile pra não cortar conteúdo */
        background-image: none;
        background: #fdfbf3;
    }
}
</style>