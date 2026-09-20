<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Vendas" icon="point_of_sale" to="/vendas" />
            <q-breadcrumbs-el label="Pedidos" icon="receipt_long" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md page-header">
            <div class="text-h5 text-weight-bold">Pedidos de Venda</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Novo Pedido" @click="openDialog()" class="q-ml-sm new-order-btn" />
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
                :pagination="{ rowsPerPage: 10 }" flat class="responsive-table">

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
                            <q-tooltip>Gerenciar Itens</q-tooltip>
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

        <!-- Diálogo de Cadastro/Edição -->
        <q-dialog v-model="dialog" persistent maximized>
            <q-card class="q-pa-sm q-pa-md-sm pedido-dialog-card">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">{{ isEditing ? 'Editar' : 'Novo' }} Pedido</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-md">
                    <q-form @submit="savePedido" class="q-gutter-md">
                        <q-select v-model="form.cliente" :options="clientesOptions" emit-value map-options outlined
                            dense label="Cliente *" :rules="[val => !!val || 'Cliente é obrigatório']" />

                        <q-select v-model="form.status" :options="statusOptions" emit-value map-options outlined dense
                            label="Status *" :rules="[val => !!val || 'Status é obrigatório']" />

                        <!-- Seção de Itens (Apenas na Criação) -->
                        <div v-if="!isEditing" class="q-mt-md">
                            <q-separator class="q-mb-md" />
                            <div class="text-subtitle2 text-weight-bold q-mb-sm">Itens do Pedido</div>

                            <!-- Adicionar Item -->
                            <div class="row q-col-gutter-sm q-mb-md items-end">
                                <div class="col-12 col-sm-6">
                                    <q-select v-model="tempItem.produto_id" :options="produtosOptions" emit-value
                                        map-options outlined dense label="Produto *"
                                        :rules="[val => !!val || 'Produto é obrigatório']" />
                                </div>
                                <div class="col-6 col-sm-3">
                                    <q-input v-model.number="tempItem.quantidade" type="number" min="1" outlined dense
                                        label="Qtd *" :rules="[val => val >= 1 || 'Mínimo 1']" />
                                </div>
                                <div class="col-6 col-sm-3">
                                    <q-btn color="primary" icon="add" label="Adicionar" @click="addItem"
                                        class="full-width" :disable="!tempItem.produto_id || tempItem.quantidade < 1" />
                                </div>
                            </div>

                            <!-- Lista de Itens Adicionados -->
                            <q-list bordered separator class="rounded-borders" v-if="form.itens.length > 0">
                                <q-item v-for="(item, index) in form.itens" :key="index">
                                    <q-item-section>
                                        <q-item-label class="text-weight-medium">{{ getProdutoNome(item.produto_id)
                                        }}</q-item-label>
                                        <q-item-label caption>
                                            Qtd: {{ item.quantidade }} x R$ {{
                                                formatCurrency(getProdutoPreco(item.produto_id))
                                            }}
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side class="column items-end">
                                        <div class="text-weight-bold text-primary q-mb-xs">
                                            R$ {{ formatCurrency(item.quantidade * getProdutoPreco(item.produto_id)) }}
                                        </div>
                                        <q-btn flat round color="negative" icon="close" size="sm"
                                            @click="removeItem(index)">
                                            <q-tooltip>Remover item</q-tooltip>
                                        </q-btn>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                            <q-banner v-else class="bg-grey-2 text-grey-8 rounded-borders">
                                Nenhum item adicionado ainda.
                            </q-banner>
                        </div>

                        <q-banner v-if="!isEditing" class="bg-orange-1 text-orange-9 rounded-borders q-mt-md">
                            <template v-slot:avatar>
                                <q-icon name="info" color="orange" />
                            </template>
                            O valor total e a baixa no estoque serão processados automaticamente ao criar o pedido.
                        </q-banner>

                        <div class="row justify-end q-mt-md">
                            <q-btn label="Cancelar" color="grey-7" flat v-close-popup class="q-mr-sm" />
                            <q-btn :label="isEditing ? 'Salvar Alterações' : 'Criar Pedido'" color="primary"
                                type="submit" :loading="saving" />
                        </div>
                    </q-form>
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
    return clientes.value.map(c => ({ label: c.nome, value: c.id }))
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

// --- Métodos Auxiliares ---
const getProdutoNome = (produtoId) => {
    const prod = (produtos.value || []).find(p => p.id === produtoId)
    return prod ? prod.nome : `Produto ID: ${produtoId}`
}

const getProdutoPreco = (produtoId) => {
    const prod = (produtos.value || []).find(p => p.id === produtoId)
    return prod ? prod.preco : 0
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
            itens: [] // Edição de itens é feita via "Gerenciar Itens"
        }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm }
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
        $q.notify({ color: 'positive', message: isEditing.value ? 'Pedido atualizado com sucesso!' : 'Pedido criado e estoque reservado com sucesso!', icon: 'check' })
        dialog.value = false
    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.itens?.[0] || data?.non_field_errors?.[0] || 'Erro ao salvar pedido'

        $q.notify({
            color: 'negative',
            message: errorMsg,
            icon: 'error',
            timeout: 5000 // Tempo maior para ler erros de validação
        })
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
    $q.notify({
        message: `Redirecionando para gerenciamento de itens do Pedido #${pedido.id}...`,
        color: 'secondary',
        icon: 'list'
    })
    // router.push(`/vendas/pedidos/${pedido.id}/itens`)
}

</script>

<style scoped>
.page-header {
    min-height: 40px;
}

.new-order-btn {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.responsive-table {
    width: 100%;
}

.pedido-dialog-card {
    width: min(700px, calc(100vw - 24px));
    min-width: 0;
    max-height: 90vh;
    overflow-y: auto;
}

@media (max-width: 599px) {
    .page-header {
        align-items: stretch;
        flex-wrap: wrap;
        gap: 8px;
    }

    .page-header .text-h5 {
        width: 100%;
        font-size: 1.25rem;
    }

    .new-order-btn {
        margin-left: 0;
        width: 100%;
    }

    .pedido-dialog-card {
        width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }
}
</style>