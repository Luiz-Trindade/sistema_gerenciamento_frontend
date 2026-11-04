<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Estoque" icon="inventory_2" to="/estoque" />
            <q-breadcrumbs-el label="Produtos" icon="shopping_bag" />
        </q-breadcrumbs>

        <!-- Cabeçalho -->
        <div class="row items-center q-mb-md page-header">
            <div>
                <div class="text-h5 text-weight-bold">Produtos</div>
                <div class="text-caption text-grey-7">Catálogo de itens e saldos de estoque</div>
            </div>
            <q-space />
            <q-btn color="primary" icon="add" label="Novo Produto" no-caps @click="openDialog()"
                class="q-ml-sm new-order-btn" :class="$q.screen.lt.sm ? 'full-width q-mt-sm' : ''" />
        </div>

        <!-- Barra de Busca -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm">
                <q-input v-model="search" dense outlined placeholder="Buscar produto por nome ou descrição..."
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

        <!-- Tabela -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredProdutos" :columns="columns" row-key="id" :loading="loading" dense flat
                :pagination="{ rowsPerPage: 10 }" separator="horizontal" class="full-width">

                <template #body-cell-imagem="props">
                    <q-td :props="props" class="text-center">
                        <q-img v-if="props.row.imagem" :src="getImageUrl(props.row.imagem)" :alt="props.row.nome"
                            class="table-image rounded-borders" fit="cover" />
                        <q-icon v-else name="image_not_supported" size="24px" color="grey-5" />
                    </q-td>
                </template>

                <template #body-cell-nome="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">{{ props.row.nome }}</div>
                        <div v-if="props.row.descricao" class="text-caption text-grey-7 ellipsis"
                            style="max-width: 250px;">
                            {{ props.row.descricao }}
                        </div>
                    </q-td>
                </template>

                <template #body-cell-preco="props">
                    <q-td :props="props" class="text-weight-medium text-right">
                        R$ {{ formatCurrency(props.row.preco) }}
                    </q-td>
                </template>

                <template #body-cell-saldo_estoque="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="getSaldoBadgeColor(props.row.saldo_estoque)" class="q-pa-xs text-caption">
                            {{ props.row.saldo_estoque ?? 0 }} un
                        </q-badge>
                    </q-td>
                </template>

                <template #body-cell-ativo="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="props.row.ativo ? 'positive' : 'grey-7'">
                            {{ props.row.ativo ? 'Ativo' : 'Inativo' }}
                        </q-badge>
                    </q-td>
                </template>

                <template #body-cell-actions="props">
                    <q-td :props="props" class="text-center">
                        <q-btn flat round color="secondary" icon="swap_horiz" size="sm"
                            @click="openMovimentacao(props.row)">
                            <q-tooltip>Movimentar Estoque</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="primary" icon="edit" size="sm" @click="openDialog(props.row)">
                            <q-tooltip>Editar</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)">
                            <q-tooltip>Excluir</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>

                <template #no-data="{ icon, message, filter }">
                    <div class="full-width row flex-center text-grey-7 q-pa-lg">
                        <q-icon size="2em" :name="filter ? 'search_off' : icon" />
                        <span class="q-ml-sm">
                            {{ filter ? 'Nenhum produto encontrado.' : message }}
                        </span>
                    </div>
                </template>
            </q-table>
        </q-card>

        <!-- Diálogo de Cadastro / Edição -->
        <q-dialog v-model="dialog" persistent :maximized="$q.screen.lt.sm">
            <q-card class="column no-wrap" :style="$q.screen.lt.sm ? '' : 'width: 550px; max-width: 90vw;'">
                <q-card-section class="row items-center q-pb-none">
                    <q-icon :name="isEditing ? 'edit' : 'shopping_bag'" color="primary" size="28px" class="q-mr-sm" />
                    <div class="text-h6">{{ isEditing ? 'Editar' : 'Novo' }} Produto</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup :disable="saving" />
                </q-card-section>

                <q-card-section class="col scroll q-pt-md">
                    <q-form @submit="saveProduto" class="q-gutter-md">
                        <q-input v-model="form.nome" label="Nome do Produto *" outlined dense
                            :rules="[val => !!val || 'Nome é obrigatório']" :disable="saving" />

                        <q-input v-model="form.descricao" label="Descrição" type="textarea" outlined dense rows="3"
                            autogrow :disable="saving" />

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-input v-model.number="form.preco" label="Preço (R$) *" type="number" step="0.01"
                                    min="0" outlined dense prefix="R$"
                                    :rules="[val => val >= 0 || 'Preço deve ser maior ou igual a zero']"
                                    :disable="saving" />
                            </div>
                            <div class="col-12 col-sm-6 flex items-center">
                                <q-toggle v-model="form.ativo" label="Produto Ativo" color="positive"
                                    :disable="saving" />
                            </div>
                        </div>

                        <!-- Upload de Imagem -->
                        <div>
                            <q-file v-model="form.imagemFile" label="Foto do Produto" outlined dense accept="image/*"
                                clearable :disable="saving" @rejected="onFileRejected">
                                <template #prepend>
                                    <q-icon name="cloud_upload" />
                                </template>
                            </q-file>

                            <!-- Preview da imagem -->
                            <div v-if="imagemPreview" class="q-mt-sm row items-center q-gutter-sm">
                                <q-img :src="imagemPreview" class="preview-img rounded-borders" fit="cover" />
                                <div class="text-caption text-grey-7">
                                    {{ form.imagemFile ? 'Nova foto selecionada' : 'Foto atual' }}
                                </div>
                            </div>
                        </div>

                        <div class="row justify-end q-col-gutter-sm q-mt-md">
                            <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                                <q-btn label="Cancelar" color="grey-7" flat v-close-popup no-caps
                                    :class="$q.screen.lt.sm ? 'full-width' : 'q-mr-sm'" :disable="saving" />
                            </div>
                            <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                                <q-btn :label="isEditing ? 'Salvar' : 'Cadastrar'" color="primary" type="submit" no-caps
                                    :loading="saving" :class="$q.screen.lt.sm ? 'full-width' : ''" />
                            </div>
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const $q = useQuasar()
const router = useRouter()
const queryClient = useQueryClient()

const search = ref('')
const dialog = ref(false)
const isEditing = ref(false)

const defaultForm = {
    id: null,
    nome: '',
    descricao: '',
    preco: 0.00,
    ativo: true,
    imagem: null,
    imagemFile: null
}
const form = ref({ ...defaultForm })

const columns = [
    { name: 'imagem', label: 'Imagem', field: 'imagem', align: 'center' },
    { name: 'nome', label: 'Nome', field: 'nome', align: 'left', sortable: true },
    { name: 'preco', label: 'Preço', field: 'preco', align: 'right', sortable: true },
    { name: 'saldo_estoque', label: 'Saldo', field: 'saldo_estoque', align: 'center', sortable: true },
    { name: 'ativo', label: 'Status', field: 'ativo', align: 'center', sortable: true },
    { name: 'actions', label: 'Ações', align: 'center' }
]

const extractList = (data) => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (Array.isArray(data.results)) return data.results
    return []
}

const getImageUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const baseURL = api.defaults.baseURL || ''
    const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${cleanBase}${cleanPath}`
}

const getSaldoBadgeColor = (saldo) => {
    if (!saldo || saldo <= 0) return 'negative'
    if (saldo <= 5) return 'warning'
    return 'positive'
}

// LEITURA
const { data: produtosData, isLoading: loading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => (await api.get('/produtos/')).data
})

const produtos = computed(() => extractList(produtosData.value))

const filteredProdutos = computed(() => {
    if (!search.value) return produtos.value
    const term = search.value.toLowerCase().trim()
    return produtos.value.filter(p =>
        p.nome?.toLowerCase().includes(term) ||
        p.descricao?.toLowerCase().includes(term)
    )
})

const imagemPreview = computed(() => {
    if (form.value.imagemFile) {
        return URL.createObjectURL(form.value.imagemFile)
    }
    if (form.value.imagem) {
        return getImageUrl(form.value.imagem)
    }
    return null
})

const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0,00'
    return parseFloat(value).toFixed(2).replace('.', ',')
}

const openDialog = (produto = null) => {
    if (produto) {
        isEditing.value = true
        form.value = {
            id: produto.id,
            nome: produto.nome,
            descricao: produto.descricao || '',
            preco: parseFloat(produto.preco) || 0.00,
            ativo: produto.ativo,
            imagem: produto.imagem || null,
            imagemFile: null
        }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm }
    }
    dialog.value = true
}

const onFileRejected = () => {
    $q.notify({ color: 'warning', message: 'Selecione um arquivo de imagem válido.', icon: 'warning' })
}

// ESCRITA
const { mutateAsync: saveProdutoMutation, isPending: saving } = useMutation({
    mutationFn: async ({ formValues, isEditing }) => {
        const formData = new FormData()
        formData.append('nome', formValues.nome)
        formData.append('descricao', formValues.descricao || '')
        formData.append('preco', formValues.preco)
        formData.append('ativo', formValues.ativo)

        if (formValues.imagemFile instanceof File) {
            formData.append('imagem', formValues.imagemFile)
        }

        const headers = { 'Content-Type': 'multipart/form-data' }

        if (isEditing) {
            const response = await api.patch(`/produtos/${formValues.id}/`, formData, { headers })
            return response.data
        } else {
            const response = await api.post('/produtos/', formData, { headers })
            return response.data
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
        queryClient.invalidateQueries({ queryKey: ['estoque', 'resumo'] })
    }
})

const saveProduto = async () => {
    try {
        await saveProdutoMutation({ formValues: form.value, isEditing: isEditing.value })
        $q.notify({
            color: 'positive',
            message: isEditing.value ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!',
            icon: 'check'
        })
        dialog.value = false
    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.nome?.[0] || data?.imagem?.[0] || 'Erro ao salvar produto'
        $q.notify({
            color: 'negative',
            message: errorMsg,
            icon: 'error'
        })
    }
}

// EXCLUSÃO
const { mutateAsync: deleteProdutoMutation } = useMutation({
    mutationFn: async (id) => {
        await api.delete(`/produtos/${id}/`)
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
        queryClient.invalidateQueries({ queryKey: ['estoque', 'resumo'] })
    }
})

const confirmDelete = (produto) => {
    $q.dialog({
        title: 'Excluir Produto?',
        message: `Deseja realmente excluir o produto "${produto.nome}"?`,
        cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
        ok: { label: 'Excluir', color: 'negative', unelevated: true },
        persistent: true
    }).onOk(async () => {
        try {
            await deleteProdutoMutation(produto.id)
            $q.notify({ color: 'positive', message: 'Produto excluído com sucesso', icon: 'delete' })
        } catch (error) {
            $q.notify({
                color: 'negative',
                message: error.response?.data?.detail || 'Erro ao excluir produto. Ele pode ter movimentações vinculadas.',
                icon: 'error'
            })
        }
    })
}

const openMovimentacao = (produto) => {
    router.push({ path: '/estoque/movimentacoes', query: { produto_id: produto.id } })
}
</script>

<style scoped>
.table-image {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    margin: 0 auto;
}

.preview-img {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
}
</style>