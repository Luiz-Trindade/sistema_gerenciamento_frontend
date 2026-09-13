<template>
    <q-page class="q-pa-md">

        <!-- Breadcrumbs (Navegação estrutural) -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Estoque" icon="inventory_2" to="/estoque" />
            <q-breadcrumbs-el label="Produtos" icon="shopping_bag" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md">
            <div class="text-h5 text-weight-bold">Produtos</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Novo Produto" @click="openDialog()" class="q-ml-sm" />
        </div>

        <!-- Barra de Ferramentas (Busca) -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm">
                <q-input v-model="search" dense outlined placeholder="Buscar por nome ou descrição..."
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

        <!-- Tabela de Produtos -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredProdutos" :columns="columns" row-key="id" :loading="loading"
                :pagination="{ rowsPerPage: 10 }" flat>
                <!-- Template para colunas personalizadas -->
                <template v-slot:body-cell-preco="props">
                    <q-td :props="props" class="text-weight-medium">
                        R$ {{ formatCurrency(props.row.preco) }}
                    </q-td>
                </template>

                <template v-slot:body-cell-saldo_estoque="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="props.row.saldo_estoque > 0 ? 'positive' : 'negative'"
                            class="text-body1 q-pa-sm">
                            {{ props.row.saldo_estoque }} un
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-ativo="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="props.row.ativo ? 'info' : 'grey-7'">
                            {{ props.row.ativo ? 'Ativo' : 'Inativo' }}
                        </q-badge>
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
                        <!-- Botão opcional para abrir modal de movimentação -->
                        <q-btn flat round color="secondary" icon="swap_horiz" size="sm"
                            @click="openMovimentacao(props.row)">
                            <q-tooltip>Movimentar</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- Diálogo de Cadastro/Edição -->
        <q-dialog v-model="dialog" persistent>
            <q-card style="min-width: 400px; max-width: 600px;">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">{{ isEditing ? 'Editar' : 'Novo' }} Produto</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-md">
                    <q-form @submit="saveProduto" class="q-gutter-md">
                        <q-input v-model="form.nome" label="Nome do Produto *" outlined dense
                            :rules="[val => !!val || 'Nome é obrigatório']" />

                        <q-input v-model="form.descricao" label="Descrição" type="textarea" outlined dense rows="3" />

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-input v-model.number="form.preco" label="Preço (R$) *" type="number" step="0.01"
                                    min="0" outlined dense prefix="R$"
                                    :rules="[val => val >= 0 || 'Preço deve ser maior ou igual a zero']" />
                            </div>
                            <div class="col-12 col-sm-6 flex items-center">
                                <q-toggle v-model="form.ativo" label="Produto Ativo" color="positive" />
                            </div>
                        </div>

                        <div class="row justify-end q-mt-md">
                            <q-btn label="Cancelar" color="grey-7" flat v-close-popup class="q-mr-sm" />
                            <q-btn :label="isEditing ? 'Salvar' : 'Cadastrar'" color="primary" type="submit"
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
// import api from 'src/boot/axios' // Descomente e ajuste conforme sua configuração de API

const $q = useQuasar()

// --- Estado ---
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const dialog = ref(false)
const isEditing = ref(false)
const produtos = ref([])

const defaultForm = {
    id: null,
    nome: '',
    descricao: '',
    preco: 0.00,
    ativo: true
}
const form = ref({ ...defaultForm })

// --- Colunas da Tabela ---
const columns = [
    { name: 'nome', label: 'Nome', field: 'nome', align: 'left', sortable: true },
    { name: 'descricao', label: 'Descrição', field: 'descricao', align: 'left' },
    { name: 'preco', label: 'Preço', field: 'preco', align: 'right', sortable: true },
    { name: 'saldo_estoque', label: 'Saldo', field: 'saldo_estoque', align: 'center', sortable: true },
    { name: 'ativo', label: 'Status', field: 'ativo', align: 'center', sortable: true },
    { name: 'actions', label: 'Ações', field: 'actions', align: 'center' }
]

// --- Computed ---
const filteredProdutos = computed(() => {
    if (!search.value) return produtos.value
    const term = search.value.toLowerCase()
    return produtos.value.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        (p.descricao && p.descricao.toLowerCase().includes(term))
    )
})

// --- Métodos ---
const formatCurrency = (value) => {
    return parseFloat(value).toFixed(2).replace('.', ',')
}

const fetchProdutos = async () => {
    loading.value = true
    try {
        // MOCK: Substitua pela chamada real à sua API Django (ex: api.get('/api/produtos/'))
        // NOTA: Sua ViewSet/Serializer no Django deve annotar o 'saldo_estoque' para vir no JSON.
        await new Promise(resolve => setTimeout(resolve, 600)) // Simula delay de rede
        produtos.value = [
            { id: 1, nome: 'Notebook Dell', descricao: 'i7, 16GB RAM', preco: 4500.00, ativo: true, saldo_estoque: 15 },
            { id: 2, nome: 'Mouse Sem Fio', descricao: 'Logitech MX', preco: 250.50, ativo: true, saldo_estoque: 0 },
            { id: 3, nome: 'Teclado Mecânico', descricao: 'Switch Red', preco: 380.00, ativo: false, saldo_estoque: 5 },
        ]
    } catch {
        $q.notify({ color: 'negative', message: 'Erro ao carregar produtos', icon: 'error' })
    } finally {
        loading.value = false
    }
}

const openDialog = (produto = null) => {
    if (produto) {
        isEditing.value = true
        form.value = { ...produto }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm }
    }
    dialog.value = true
}

const saveProduto = async () => {
    saving.value = true
    try {
        // MOCK: Substitua por api.post() ou api.put()
        await new Promise(resolve => setTimeout(resolve, 800))

        if (isEditing.value) {
            const index = produtos.value.findIndex(p => p.id === form.value.id)
            if (index !== -1) produtos.value[index] = { ...form.value }
            $q.notify({ color: 'positive', message: 'Produto atualizado com sucesso!', icon: 'check' })
        } else {
            const newId = produtos.value.length > 0 ? Math.max(...produtos.value.map(p => p.id)) + 1 : 1
            produtos.value.push({ ...form.value, id: newId, saldo_estoque: 0 })
            $q.notify({ color: 'positive', message: 'Produto cadastrado com sucesso!', icon: 'check' })
        }
        dialog.value = false
    } catch {
        $q.notify({ color: 'negative', message: 'Erro ao salvar produto', icon: 'error' })
    } finally {
        saving.value = false
    }
}

const confirmDelete = (produto) => {
    $q.dialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir o produto "${produto.nome}"?`,
        cancel: true,
        persistent: true
    }).onOk(async () => {
        // MOCK: Substitua por api.delete(`/api/produtos/${produto.id}/`)
        produtos.value = produtos.value.filter(p => p.id !== produto.id)
        $q.notify({ color: 'positive', message: 'Produto excluído', icon: 'delete' })
    })
}

const openMovimentacao = (produto) => {
    // Lógica para abrir um segundo diálogo ou redirecionar para a tela de movimentações
    $q.notify({ message: `Abrir movimentação para: ${produto.nome}`, color: 'secondary', icon: 'swap_horiz' })
}

// --- Lifecycle ---
onMounted(() => {
    fetchProdutos()
})
</script>

<style scoped>
/* Ajustes finos de layout se necessário */
</style>