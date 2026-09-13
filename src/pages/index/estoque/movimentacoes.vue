<template>
    <q-page class="q-pa-md">

        <!-- Breadcrumbs (Navegação estrutural) -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Estoque" icon="inventory_2" to="/estoque" />
            <q-breadcrumbs-el label="Movimentações" icon="swap_horiz" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md">
            <div class="text-h5 text-weight-bold">Movimentações de Estoque</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Nova Movimentação" @click="openDialog()" class="q-ml-sm" />
        </div>

        <!-- Barra de Filtros -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row q-col-gutter-sm q-py-sm">
                <div class="col-12 col-sm-6">
                    <q-input v-model="search" dense outlined placeholder="Buscar por produto...">
                        <template v-slot:prepend>
                            <q-icon name="search" />
                        </template>
                        <template v-slot:append>
                            <q-icon v-if="search" name="clear" class="cursor-pointer" @click="search = ''" />
                        </template>
                    </q-input>
                </div>
                <div class="col-12 col-sm-3">
                    <q-select v-model="filterTipo" :options="tipoOptions" emit-value map-options dense outlined
                        label="Tipo" clearable />
                </div>
                <div class="col-12 col-sm-3">
                    <q-select v-model="filterProduto" :options="produtoOptions" emit-value map-options dense outlined
                        label="Produto" clearable />
                </div>
            </q-card-section>
        </q-card>

        <!-- Tabela de Movimentações -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredMovimentacoes" :columns="columns" row-key="id" :loading="loading"
                :pagination="{ rowsPerPage: 15, sortBy: 'criado_em', descending: true }" flat>
                <!-- Template para colunas personalizadas -->
                <template v-slot:body-cell-tipo="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="props.row.tipo === 'entrada' ? 'positive' : 'negative'"
                            class="text-body2 q-pa-sm">
                            <q-icon :name="props.row.tipo === 'entrada' ? 'arrow_downward' : 'arrow_upward'" size="16px"
                                class="q-mr-xs" />
                            {{ props.row.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-quantidade="props">
                    <q-td :props="props" class="text-center text-weight-bold">
                        <span :class="props.row.tipo === 'entrada' ? 'text-positive' : 'text-negative'">
                            {{ props.row.tipo === 'entrada' ? '+' : '-' }}{{ props.row.quantidade }}
                        </span>
                    </q-td>
                </template>

                <template v-slot:body-cell-criado_em="props">
                    <q-td :props="props">
                        {{ formatDate(props.row.criado_em) }}
                    </q-td>
                </template>

                <template v-slot:body-cell-actions="props">
                    <q-td :props="props" class="text-center">
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
        <q-dialog v-model="dialog" persistent>
            <q-card style="min-width: 450px; max-width: 650px;">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">{{ isEditing ? 'Editar' : 'Nova' }} Movimentação</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-md">
                    <q-form @submit="saveMovimentacao" class="q-gutter-md">
                        <q-select v-model="form.produto" :options="produtoOptions" emit-value map-options outlined dense
                            label="Produto *" :rules="[val => !!val || 'Produto é obrigatório']" />

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-select v-model="form.tipo" :options="tipoOptions" emit-value map-options outlined
                                    dense label="Tipo *" :rules="[val => !!val || 'Tipo é obrigatório']" />
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input v-model.number="form.quantidade" label="Quantidade *" type="number" min="1"
                                    outlined dense :rules="[val => val >= 1 || 'Quantidade deve ser maior que zero']" />
                            </div>
                        </div>

                        <q-input v-model="form.observacao" label="Observação" type="textarea" outlined dense rows="3" />

                        <div class="row justify-end q-mt-md">
                            <q-btn label="Cancelar" color="grey-7" flat v-close-popup class="q-mr-sm" />
                            <q-btn :label="isEditing ? 'Salvar' : 'Registrar'" color="primary" type="submit"
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
const filterTipo = ref(null)
const filterProduto = ref(null)
const dialog = ref(false)
const isEditing = ref(false)
const movimentacoes = ref([])
const produtos = ref([])

const defaultForm = {
    id: null,
    produto: null,
    tipo: null,
    quantidade: 1,
    observacao: ''
}
const form = ref({ ...defaultForm })

// --- Opções ---
const tipoOptions = [
    { label: 'Entrada', value: 'entrada' },
    { label: 'Saída', value: 'saida' }
]

const produtoOptions = computed(() => {
    return produtos.value.map(p => ({ label: p.nome, value: p.id }))
})

// --- Colunas da Tabela ---
const columns = [
    { name: 'produto_nome', label: 'Produto', field: row => row.produto?.nome || '-', align: 'left', sortable: true },
    { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'center', sortable: true },
    { name: 'quantidade', label: 'Quantidade', field: 'quantidade', align: 'center', sortable: true },
    { name: 'observacao', label: 'Observação', field: 'observacao', align: 'left' },
    { name: 'criado_em', label: 'Data/Hora', field: 'criado_em', align: 'left', sortable: true },
    { name: 'actions', label: 'Ações', field: 'actions', align: 'center' }
]

// --- Computed ---
const filteredMovimentacoes = computed(() => {
    let result = movimentacoes.value

    if (search.value) {
        const term = search.value.toLowerCase()
        result = result.filter(m =>
            m.produto?.nome.toLowerCase().includes(term) ||
            (m.observacao && m.observacao.toLowerCase().includes(term))
        )
    }

    if (filterTipo.value) {
        result = result.filter(m => m.tipo === filterTipo.value)
    }

    if (filterProduto.value) {
        result = result.filter(m => m.produto?.id === filterProduto.value)
    }

    return result
})

// --- Métodos ---
const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const fetchMovimentacoes = async () => {
    loading.value = true
    try {
        // MOCK: Substitua por api.get('/api/movimentacoes/')
        await new Promise(resolve => setTimeout(resolve, 600))
        movimentacoes.value = [
            {
                id: 1,
                produto: { id: 1, nome: 'Notebook Dell' },
                tipo: 'entrada',
                quantidade: 10,
                observacao: 'Compra inicial',
                criado_em: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                produto: { id: 2, nome: 'Mouse Sem Fio' },
                tipo: 'saida',
                quantidade: 3,
                observacao: 'Venda para cliente X',
                criado_em: '2024-01-16T14:20:00Z'
            },
            {
                id: 3,
                produto: { id: 1, nome: 'Notebook Dell' },
                tipo: 'saida',
                quantidade: 2,
                observacao: 'Venda para cliente Y',
                criado_em: '2024-01-17T09:15:00Z'
            },
        ]
    } catch {
        $q.notify({ color: 'negative', message: 'Erro ao carregar movimentações', icon: 'error' })
    } finally {
        loading.value = false
    }
}

const fetchProdutos = async () => {
    try {
        // MOCK: Substitua por api.get('/api/produtos/')
        await new Promise(resolve => setTimeout(resolve, 300))
        produtos.value = [
            { id: 1, nome: 'Notebook Dell' },
            { id: 2, nome: 'Mouse Sem Fio' },
            { id: 3, nome: 'Teclado Mecânico' },
        ]
    } catch {
        $q.notify({ color: 'negative', message: 'Erro ao carregar produtos', icon: 'error' })
    }
}

const openDialog = (movimentacao = null) => {
    if (movimentacao) {
        isEditing.value = true
        form.value = {
            id: movimentacao.id,
            produto: movimentacao.produto?.id,
            tipo: movimentacao.tipo,
            quantidade: movimentacao.quantidade,
            observacao: movimentacao.observacao || ''
        }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm }
    }
    dialog.value = true
}

const saveMovimentacao = async () => {
    saving.value = true
    try {
        // MOCK: Substitua por api.post() ou api.put()
        await new Promise(resolve => setTimeout(resolve, 800))

        const produtoSelecionado = produtos.value.find(p => p.id === form.value.produto)

        if (isEditing.value) {
            const index = movimentacoes.value.findIndex(m => m.id === form.value.id)
            if (index !== -1) {
                movimentacoes.value[index] = {
                    ...movimentacoes.value[index],
                    produto: produtoSelecionado,
                    tipo: form.value.tipo,
                    quantidade: form.value.quantidade,
                    observacao: form.value.observacao
                }
            }
            $q.notify({ color: 'positive', message: 'Movimentação atualizada!', icon: 'check' })
        } else {
            const newId = movimentacoes.value.length > 0 ? Math.max(...movimentacoes.value.map(m => m.id)) + 1 : 1
            movimentacoes.value.push({
                id: newId,
                produto: produtoSelecionado,
                tipo: form.value.tipo,
                quantidade: form.value.quantidade,
                observacao: form.value.observacao,
                criado_em: new Date().toISOString()
            })
            $q.notify({ color: 'positive', message: 'Movimentação registrada!', icon: 'check' })
        }
        dialog.value = false
    } catch {
        $q.notify({ color: 'negative', message: 'Erro ao salvar movimentação', icon: 'error' })
    } finally {
        saving.value = false
    }
}

const confirmDelete = (movimentacao) => {
    $q.dialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir esta movimentação de ${movimentacao.tipo} do produto "${movimentacao.produto?.nome}"?`,
        cancel: true,
        persistent: true
    }).onOk(async () => {
        // MOCK: Substitua por api.delete(`/api/movimentacoes/${movimentacao.id}/`)
        movimentacoes.value = movimentacoes.value.filter(m => m.id !== movimentacao.id)
        $q.notify({ color: 'positive', message: 'Movimentação excluída', icon: 'delete' })
    })
}

// --- Lifecycle ---
onMounted(() => {
    fetchProdutos()
    fetchMovimentacoes()
})
</script>

<style scoped>
.text-positive {
    color: var(--q-positive);
}

.text-negative {
    color: var(--q-negative);
}
</style>