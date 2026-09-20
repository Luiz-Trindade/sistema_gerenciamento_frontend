<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Estoque" icon="inventory_2" to="/estoque" />
            <q-breadcrumbs-el label="Movimentações" icon="swap_horiz" />
        </q-breadcrumbs>

        <!-- Cabeçalho -->
        <div class="row items-center q-mb-md page-header">
            <div class="text-h5 text-weight-bold">Movimentações de Estoque</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Nova Movimentação" @click="openDialog()"
                class="q-ml-sm new-order-btn" />
        </div>

        <!-- Barra de Filtros -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row q-col-gutter-sm q-py-sm">
                <div class="col-12 col-sm-6">
                    <q-input v-model="search" dense outlined placeholder="Buscar por produto ou observação...">
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

        <!-- Tabela -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredMovimentacoes" :columns="columns" row-key="id" :loading="loading"
                :pagination="{ rowsPerPage: 15, sortBy: 'criado_em', descending: true }" flat class="responsive-table">

                <template v-slot:body-cell-produto_nome="props">
                    <q-td :props="props">
                        {{ getProdutoNome(props.row.produto) }}
                    </q-td>
                </template>

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

        <!-- Diálogo -->
        <q-dialog v-model="dialog" persistent maximized>
            <q-card class="q-pa-sm q-pa-md-sm movimentacao-dialog-card">
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
import { api } from '@/boot/axios'

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
    { name: 'produto_nome', label: 'Produto', align: 'left', sortable: true },
    { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'center', sortable: true },
    { name: 'quantidade', label: 'Quantidade', field: 'quantidade', align: 'center', sortable: true },
    { name: 'observacao', label: 'Observação', field: 'observacao', align: 'left' },
    { name: 'criado_em', label: 'Data/Hora', field: 'criado_em', align: 'left', sortable: true },
    { name: 'actions', label: 'Ações', align: 'center' }
]

// --- Computed ---
const filteredMovimentacoes = computed(() => {
    let result = movimentacoes.value

    if (search.value) {
        const term = search.value.toLowerCase()
        result = result.filter(m => {
            const prodName = getProdutoNome(m.produto).toLowerCase()
            return prodName.includes(term) || (m.observacao && m.observacao.toLowerCase().includes(term))
        })
    }

    if (filterTipo.value) {
        result = result.filter(m => m.tipo === filterTipo.value)
    }

    if (filterProduto.value) {
        result = result.filter(m => m.produto === filterProduto.value)
    }

    return result
})

// --- Métodos Auxiliares ---
const getProdutoNome = (produtoId) => {
    const prod = produtos.value.find(p => p.id === produtoId)
    return prod ? prod.nome : `Produto ID: ${produtoId}`
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
}

// --- API Calls ---
const fetchProdutos = async () => {
    try {
        const response = await api.get('/produtos/')
        produtos.value = response.data
    } catch (error) {
        $q.notify({ color: 'negative', message: error.response?.data?.detail || 'Erro ao carregar produtos', icon: 'error' })
    }
}

const fetchMovimentacoes = async () => {
    loading.value = true
    try {
        const response = await api.get('/movimentacoes/')
        movimentacoes.value = response.data
    } catch (error) {
        $q.notify({ color: 'negative', message: error.response?.data?.detail || 'Erro ao carregar movimentações', icon: 'error' })
    } finally {
        loading.value = false
    }
}

const openDialog = (movimentacao = null) => {
    if (movimentacao) {
        isEditing.value = true
        form.value = {
            id: movimentacao.id,
            produto: movimentacao.produto,
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
        if (isEditing.value) {
            await api.put(`/movimentacoes/${form.value.id}/`, form.value)
            $q.notify({ color: 'positive', message: 'Movimentação atualizada!', icon: 'check' })
        } else {
            await api.post('/movimentacoes/', form.value)
            $q.notify({ color: 'positive', message: 'Movimentação registrada!', icon: 'check' })
        }
        dialog.value = false
        fetchMovimentacoes()
    } catch (error) {
        $q.notify({ color: 'negative', message: error.response?.data?.detail || 'Erro ao salvar movimentação', icon: 'error' })
    } finally {
        saving.value = false
    }
}

const confirmDelete = (movimentacao) => {
    const prodName = getProdutoNome(movimentacao.produto)

    $q.dialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir esta movimentação de ${movimentacao.tipo} do produto "${prodName}"? Isso pode afetar o saldo de estoque.`,
        cancel: true,
        persistent: true
    }).onOk(async () => {
        try {
            await api.delete(`/movimentacoes/${movimentacao.id}/`)
            $q.notify({ color: 'positive', message: 'Movimentação excluída', icon: 'delete' })
            fetchMovimentacoes()
        } catch (error) {
            $q.notify({ color: 'negative', message: error.response?.data?.detail || 'Erro ao excluir movimentação', icon: 'error' })
        }
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

.page-header {
    min-height: 40px;
}

.new-order-btn {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.responsive-table {
    width: 100%;
}

/* Estilização para o Dialog Maximized ficar elegante e centralizado em telas grandes */
.movimentacao-dialog-card {
    max-width: 600px;
    width: 100%;
    margin: auto;
    /* Centraliza horizontal e verticalmente dentro do container maximized */
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

    /* No mobile, o dialog maximized ocupa 100% da tela sem margens */
    .movimentacao-dialog-card {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
        margin: 0;
    }
}
</style>