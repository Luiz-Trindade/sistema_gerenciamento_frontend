<template>
    <q-page class="q-pa-xs q-pa-sm-sm produtos-page">
        <!-- Breadcrumbs (Navegação estrutural) -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Estoque" icon="inventory_2" to="/estoque" />
            <q-breadcrumbs-el label="Produtos" icon="shopping_bag" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md page-header">
            <div class="text-h5 text-weight-bold">Produtos</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Novo Produto" @click="openDialog()"
                class="q-ml-sm new-order-btn" />
        </div>

        <!-- Barra de Ferramentas (Busca) -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm q-px-sm">
                <q-input v-model="search" dense outlined placeholder="Buscar por nome ou descrição..."
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

        <!-- Tabela de Produtos -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredProdutos" :columns="columns" row-key="id" :loading="loading"
                :pagination="{ rowsPerPage: 10 }" flat class="responsive-table" table-style="min-width: 700px">

                <template v-slot:body-cell-preco="props">
                    <q-td :props="props" class="text-weight-medium text-right">
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
                        <q-btn flat round color="secondary" icon="swap_horiz" size="sm"
                            @click="openMovimentacao(props.row)">
                            <q-tooltip>Movimentar</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- Diálogo de Cadastro/Edição -->
        <q-dialog v-model="dialog" persistent maximized>
            <q-card class="q-pa-sm q-pa-md-sm produto-dialog-card">
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

                        <div class="row justify-end q-mt-md form-actions">
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
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const $q = useQuasar()
const queryClient = useQueryClient()

// --- Estado Local (Apenas para controle de UI) ---
const search = ref('')
const dialog = ref(false)
const isEditing = ref(false)

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
    { name: 'actions', label: 'Ações', align: 'center' }
]

// ==========================================
// 1. VUE QUERY: LEITURA (GET)
// ==========================================
// Substitui o `const produtos = ref([])` e o `onMounted` + `fetchProdutos`
const {
    data: produtos, // Será um Ref reativo com os dados (ou undefined no primeiro load)
    isLoading: loading
} = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
        const response = await api.get('/produtos/')
        return response.data
    }
})

// --- Computed ---
const filteredProdutos = computed(() => {
    // Fallback para [] caso os dados ainda estejam carregando (undefined)
    const lista = produtos.value || []

    if (!search.value) return lista

    const term = search.value.toLowerCase()
    return lista.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        (p.descricao && p.descricao.toLowerCase().includes(term))
    )
})

// --- Métodos Auxiliares ---
const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0,00'
    return parseFloat(value).toFixed(2).replace('.', ',')
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

// ==========================================
// 2. VUE QUERY: ESCRITA (POST / PUT)
// ==========================================
// Usamos mutateAsync para poder usar await e try/catch como no seu código original
const { mutateAsync: saveProdutoMutation, isPending: saving } = useMutation({
    mutationFn: async ({ formData, isEditing }) => {
        if (isEditing) {
            const response = await api.put(`/produtos/${formData.id}/`, formData)
            return response.data
        } else {
            const response = await api.post('/produtos/', formData)
            return response.data
        }
    },
    onSuccess: () => {
        // A MÁGICA: Invalida o cache. O Vue Query busca a lista atualizada do servidor 
        // automaticamente em background. Não precisamos mais fazer push ou update manual no array.
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
    }
})

const saveProduto = async () => {
    try {
        // Aguarda a mutação terminar. Se der erro, cai no catch.
        await saveProdutoMutation({ formData: form.value, isEditing: isEditing.value })

        $q.notify({
            color: 'positive',
            message: isEditing.value ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!',
            icon: 'check'
        })
        dialog.value = false
    } catch (error) {
        $q.notify({
            color: 'negative',
            message: error.response?.data?.detail || 'Erro ao salvar produto',
            icon: 'error'
        })
    }
}

// ==========================================
// 3. VUE QUERY: EXCLUSÃO (DELETE)
// ==========================================
const { mutateAsync: deleteProdutoMutation } = useMutation({
    mutationFn: async (id) => {
        await api.delete(`/produtos/${id}/`)
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
    }
})

const confirmDelete = (produto) => {
    $q.dialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir o produto "${produto.nome}"?`,
        cancel: true,
        persistent: true
    }).onOk(async () => {
        try {
            await deleteProdutoMutation(produto.id)
            $q.notify({ color: 'positive', message: 'Produto excluído com sucesso', icon: 'delete' })
        } catch (error) {
            $q.notify({
                color: 'negative',
                message: error.response?.data?.detail || 'Erro ao excluir produto',
                icon: 'error'
            })
        }
    })
}

const openMovimentacao = (produto) => {
    $q.notify({ message: `Abrir movimentação para: ${produto.nome}`, color: 'secondary', icon: 'swap_horiz' })
    // router.push({ name: 'movimentacoes', query: { produtoId: produto.id } })
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
    overflow-x: auto;
}

.responsive-table :deep(.q-table__middle) {
    overflow-x: auto;
}

.form-actions {
    flex-wrap: wrap;
    gap: 8px;
}

.produto-dialog-card {
    width: min(600px, calc(100vw - 24px));
    min-width: 0;
    max-height: 90vh;
    overflow-y: auto;
}

@media (max-width: 599px) {
    .produtos-page {
        padding: 8px;
    }

    .q-breadcrumbs {
        overflow-x: auto;
        white-space: nowrap;
    }

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

    .form-actions {
        justify-content: stretch;
    }

    .form-actions .q-btn {
        flex: 1 1 100%;
        margin: 0;
    }

    .produto-dialog-card {
        width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }
}
</style>