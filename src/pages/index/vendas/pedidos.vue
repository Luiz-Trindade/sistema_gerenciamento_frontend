<template>
    <q-page class="q-pa-md">

        <!-- Breadcrumbs (Navegação estrutural) -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Vendas" icon="point_of_sale" to="/vendas" />
            <q-breadcrumbs-el label="Pedidos" icon="receipt_long" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md">
            <div class="text-h5 text-weight-bold">Pedidos de Venda</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Novo Pedido" @click="openDialog()" class="q-ml-sm" />
        </div>

        <!-- Barra de Ferramentas (Busca) -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm">
                <q-input v-model="search" dense outlined placeholder="Buscar por cliente ou nº do pedido..."
                    class="col-12 col-sm-6">
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
                :pagination="{ rowsPerPage: 10 }" flat>
                <!-- Template: Valor Total -->
                <template v-slot:body-cell-valor_total="props">
                    <q-td :props="props" class="text-weight-medium text-right">
                        R$ {{ formatCurrency(props.row.valor_total) }}
                    </q-td>
                </template>

                <!-- Template: Status -->
                <template v-slot:body-cell-status="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="getStatusColor(props.row.status)" class="text-body2 q-pa-sm">
                            {{ formatStatus(props.row.status) }}
                        </q-badge>
                    </q-td>
                </template>

                <!-- Template: Data -->
                <template v-slot:body-cell-criado_em="props">
                    <q-td :props="props" class="text-grey-7">
                        {{ formatDate(props.row.criado_em) }}
                    </q-td>
                </template>

                <!-- Template: Ações -->
                <template v-slot:body-cell-acoes="props">
                    <q-td :props="props" class="text-center">
                        <q-btn flat round color="secondary" icon="list" size="sm" @click="gerenciarItens(props.row)">
                            <q-tooltip>Gerenciar Itens</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="primary" icon="edit" size="sm" @click="openDialog(props.row)">
                            <q-tooltip>Editar</q-tooltip>
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
            <q-card class="q-pa-md">
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

                        <q-banner v-if="!isEditing" class="bg-orange-1 text-orange-9 rounded-borders">
                            <template v-slot:avatar>
                                <q-icon name="info" color="orange" />
                            </template>
                            O valor total será calculado automaticamente ao adicionar os itens (movimentações) ao
                            pedido.
                        </q-banner>

                        <div class="row justify-end q-mt-md">
                            <q-btn label="Cancelar" color="grey-7" flat v-close-popup class="q-mr-sm" />
                            <q-btn :label="isEditing ? 'Salvar' : 'Criar'" color="primary" type="submit"
                                :loading="saving" />
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
// import api from 'src/boot/axios'

const $q = useQuasar()

// --- Estado ---
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const dialog = ref(false)
const isEditing = ref(false)
const pedidos = ref([])
const clientes = ref([])

const defaultForm = {
    id: null,
    cliente: null,
    status: 'criado'
}
const form = ref({ ...defaultForm })

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

// --- Colunas da Tabela ---
const columns = [
    { name: 'id', label: 'Nº', field: 'id', align: 'center', sortable: true },
    { name: 'cliente_nome', label: 'Cliente', field: row => row.cliente?.nome || 'N/A', align: 'left', sortable: true },
    { name: 'criado_em', label: 'Data', field: 'criado_em', align: 'left', sortable: true },
    { name: 'quantidade_total', label: 'Itens', field: 'quantidade_total', align: 'center', sortable: true },
    { name: 'valor_total', label: 'Valor Total', field: 'valor_total', align: 'right', sortable: true },
    { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
    { name: 'acoes', label: 'Ações', field: 'acoes', align: 'center' }
]

// --- Computed ---
const filteredPedidos = computed(() => {
    if (!search.value) return pedidos.value
    const term = search.value.toLowerCase()
    return pedidos.value.filter(p =>
        p.id.toString().includes(term) ||
        (p.cliente?.nome && p.cliente.nome.toLowerCase().includes(term))
    )
})

// --- Métodos Auxiliares ---
const formatCurrency = (value) => {
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

// --- API / Mock ---
const fetchPedidos = async () => {
    loading.value = true
    try {
        // MOCK: Substitua por api.get('/api/pedidos/')
        await new Promise(resolve => setTimeout(resolve, 600))
        pedidos.value = [
            { id: 101, cliente: { id: 1, nome: 'Luiz Gabriel Trindade' }, status: 'concluido', valor_total: 4750.50, quantidade_total: 2, criado_em: '2023-10-25T10:00:00Z' },
            { id: 102, cliente: { id: 2, nome: 'Empresa Tech Solutions LTDA' }, status: 'processando', valor_total: 1200.00, quantidade_total: 5, criado_em: '2023-10-26T14:30:00Z' },
            { id: 103, cliente: { id: 3, nome: 'Maria da Silva' }, status: 'criado', valor_total: 380.00, quantidade_total: 1, criado_em: '2023-10-27T09:15:00Z' },
        ]
    } catch {
        $q.notify({ color: 'negative', message: 'Erro ao carregar pedidos', icon: 'error' })
    } finally {
        loading.value = false
    }
}

const fetchClientes = async () => {
    try {
        // MOCK: Substitua por api.get('/api/clientes/')
        await new Promise(resolve => setTimeout(resolve, 300))
        clientes.value = [
            { id: 1, nome: 'Luiz Gabriel Trindade' },
            { id: 2, nome: 'Empresa Tech Solutions LTDA' },
            { id: 3, nome: 'Maria da Silva' },
        ]
    } catch {
        $q.notify({ color: 'negative', message: 'Erro ao carregar clientes', icon: 'error' })
    }
}

// --- Ações do Usuário ---
const openDialog = (pedido = null) => {
    if (pedido) {
        isEditing.value = true
        form.value = {
            id: pedido.id,
            cliente: pedido.cliente?.id,
            status: pedido.status
        }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm }
    }
    dialog.value = true
}

const savePedido = async () => {
    saving.value = true
    try {
        // MOCK: Substitua por api.post() ou api.put()
        await new Promise(resolve => setTimeout(resolve, 800))

        const clienteSelecionado = clientes.value.find(c => c.id === form.value.cliente)

        if (isEditing.value) {
            const index = pedidos.value.findIndex(p => p.id === form.value.id)
            if (index !== -1) {
                pedidos.value[index] = {
                    ...pedidos.value[index],
                    cliente: clienteSelecionado,
                    status: form.value.status
                }
            }
            $q.notify({ color: 'positive', message: 'Pedido atualizado com sucesso!', icon: 'check' })
        } else {
            const newId = pedidos.value.length > 0 ? Math.max(...pedidos.value.map(p => p.id)) + 1 : 100
            pedidos.value.push({
                id: newId,
                cliente: clienteSelecionado,
                status: form.value.status,
                valor_total: 0.00, // Será calculado pelo Django ao adicionar movimentações
                quantidade_total: 0,
                criado_em: new Date().toISOString()
            })
            $q.notify({ color: 'positive', message: 'Pedido criado! Adicione os itens agora.', icon: 'check' })
        }
        dialog.value = false
    } catch {
        $q.notify({ color: 'negative', message: 'Erro ao salvar pedido', icon: 'error' })
    } finally {
        saving.value = false
    }
}

const confirmDelete = (pedido) => {
    $q.dialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir o pedido #${pedido.id}?`,
        cancel: true,
        persistent: true
    }).onOk(async () => {
        // MOCK: Substitua por api.delete(`/api/pedidos/${pedido.id}/`)
        pedidos.value = pedidos.value.filter(p => p.id !== pedido.id)
        $q.notify({ color: 'positive', message: 'Pedido excluído', icon: 'delete' })
    })
}

const gerenciarItens = (pedido) => {
    // Aqui você pode redirecionar para uma tela de detalhes do pedido 
    // ou abrir um diálogo complexo para adicionar Movimentacao (ManyToMany)
    $q.notify({
        message: `Gerenciando itens do Pedido #${pedido.id}`,
        color: 'secondary',
        icon: 'list'
    })
    // Exemplo: router.push(`/vendas/pedidos/${pedido.id}/itens`)
}

// --- Lifecycle ---
onMounted(() => {
    fetchClientes()
    fetchPedidos()
})
</script>

<style scoped>
/* Ajustes finos de layout se necessário */
</style>