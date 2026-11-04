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
            <div>
                <div class="text-h5 text-weight-bold">Movimentações de Estoque</div>
                <div class="text-caption text-grey-7">Histórico e registro de entradas e saídas</div>
            </div>
            <q-space />
            <q-btn color="primary" icon="add" label="Nova Movimentação" no-caps @click="openDialog()"
                class="q-ml-sm new-order-btn" :class="$q.screen.lt.sm ? 'full-width q-mt-sm' : ''" />
        </div>

        <!-- Barra de Filtros -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row q-col-gutter-sm q-py-sm">
                <div class="col-12 col-sm-6">
                    <q-input v-model="search" dense outlined placeholder="Buscar por produto ou observação...">
                        <template #prepend>
                            <q-icon name="search" />
                        </template>
                        <template #append>
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
                        label="Produto" clearable use-input input-debounce="200" />
                </div>
            </q-card-section>
        </q-card>

        <!-- Tabela -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredMovimentacoes" :columns="columns" row-key="id" :loading="loading" dense flat
                :pagination="{ rowsPerPage: 15, sortBy: 'criado_em', descending: true }" separator="horizontal"
                class="full-width">

                <template #body-cell-produto_nome="props">
                    <q-td :props="props">
                        <span class="text-weight-medium">{{ props.row.produto?.nome || '-' }}</span>
                    </q-td>
                </template>

                <template #body-cell-tipo="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="props.row.tipo === 'entrada' ? 'positive' : 'negative'" class="q-pa-xs">
                            <q-icon :name="props.row.tipo === 'entrada' ? 'arrow_downward' : 'arrow_upward'" size="14px"
                                class="q-mr-xs" />
                            {{ props.row.tipo === 'entrada' ? 'Entrada' : 'Saída' }}
                        </q-badge>
                    </q-td>
                </template>

                <template #body-cell-quantidade="props">
                    <q-td :props="props" class="text-center text-weight-bold">
                        <span :class="props.row.tipo === 'entrada' ? 'text-positive' : 'text-negative'">
                            {{ props.row.tipo === 'entrada' ? '+' : '-' }}{{ props.row.quantidade }}
                        </span>
                    </q-td>
                </template>

                <template #body-cell-criado_em="props">
                    <q-td :props="props">
                        {{ formatDate(props.row.criado_em) }}
                    </q-td>
                </template>

                <template #body-cell-actions="props">
                    <q-td :props="props" class="text-center">
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
                            {{ filter ? 'Nenhuma movimentação encontrada.' : message }}
                        </span>
                    </div>
                </template>
            </q-table>
        </q-card>

        <!-- Diálogo de Cadastro / Edição -->
        <q-dialog v-model="dialog" persistent :maximized="$q.screen.lt.sm">
            <q-card class="column no-wrap" :style="$q.screen.lt.sm ? '' : 'width: 550px; max-width: 90vw;'">
                <q-card-section class="row items-center q-pb-none">
                    <q-icon name="swap_horiz" color="primary" size="28px" class="q-mr-sm" />
                    <div class="text-h6">{{ isEditing ? 'Editar' : 'Nova' }} Movimentação</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup :disable="saving" />
                </q-card-section>

                <q-card-section class="col scroll q-pt-md">
                    <q-form @submit="saveMovimentacao" class="q-gutter-md">
                        <q-select v-model="form.produto" :options="produtoOptions" emit-value map-options outlined dense
                            label="Produto *" :rules="[val => !!val || 'Produto é obrigatório']" :disable="saving"
                            use-input input-debounce="200" />

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-select v-model="form.tipo" :options="tipoOptions" emit-value map-options outlined
                                    dense label="Tipo *" :rules="[val => !!val || 'Tipo é obrigatório']"
                                    :disable="saving" />
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input v-model.number="form.quantidade" label="Quantidade *" type="number" min="1"
                                    outlined dense :rules="[val => val >= 1 || 'Quantidade deve ser maior que zero']"
                                    :disable="saving" />
                            </div>
                        </div>

                        <q-input v-model="form.observacao" label="Observação / Motivo" type="textarea" outlined dense
                            rows="3" autogrow :disable="saving"
                            hint="Ex: Entrada de nota fiscal #1234, Ajuste de avaria, etc." />

                        <div class="row justify-end q-col-gutter-sm q-mt-md">
                            <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                                <q-btn label="Cancelar" color="grey-7" flat v-close-popup no-caps
                                    :class="$q.screen.lt.sm ? 'full-width' : 'q-mr-sm'" :disable="saving" />
                            </div>
                            <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                                <q-btn :label="isEditing ? 'Salvar' : 'Registrar'" color="primary" type="submit" no-caps
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
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const $q = useQuasar()
const route = useRoute()
const queryClient = useQueryClient()

const columns = [
    { name: 'produto_nome', label: 'Produto', field: 'produto', align: 'left', sortable: true },
    { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'center', sortable: true },
    { name: 'quantidade', label: 'Qtd.', field: 'quantidade', align: 'center', sortable: true },
    { name: 'observacao', label: 'Observação', field: 'observacao', align: 'left', sortable: false },
    { name: 'criado_em', label: 'Data', field: 'criado_em', align: 'left', sortable: true },
    { name: 'actions', label: 'Ações', field: 'actions', align: 'center', sortable: false }
]

const search = ref('')
const filterTipo = ref(null)
const filterProduto = ref(null)
const dialog = ref(false)
const isEditing = ref(false)

const defaultForm = {
    id: null,
    produto: null,
    tipo: 'entrada',
    quantidade: 1,
    observacao: ''
}
const form = ref({ ...defaultForm })

const tipoOptions = [
    { label: 'Entrada', value: 'entrada' },
    { label: 'Saída', value: 'saida' }
]

// LEITURA DE PRODUTOS
const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
        const response = await api.get('/produtos/')
        return Array.isArray(response.data) ? response.data : (response.data?.results || [])
    }
})

// LEITURA DE MOVIMENTAÇÕES
const { data: movimentacoes, isLoading: loading } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async () => {
        const response = await api.get('/movimentacoes/')
        return Array.isArray(response.data) ? response.data : (response.data?.results || [])
    }
})

const produtoOptions = computed(() => {
    return (produtos.value || []).map(p => ({ label: p.nome, value: p.id }))
})

const filteredMovimentacoes = computed(() => {
    let result = movimentacoes.value || []

    if (search.value) {
        const term = search.value.toLowerCase().trim()
        result = result.filter(m => {
            const prodName = (m.produto?.nome || '').toLowerCase()
            return prodName.includes(term) || (m.observacao && m.observacao.toLowerCase().includes(term))
        })
    }

    if (filterTipo.value) {
        result = result.filter(m => m.tipo === filterTipo.value)
    }

    if (filterProduto.value) {
        result = result.filter(m => (m.produto?.id || m.produto) === filterProduto.value)
    }

    return result
})

const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
}

const openDialog = (movimentacao = null, produtoIdInicial = null) => {
    if (movimentacao) {
        isEditing.value = true
        form.value = {
            id: movimentacao.id,
            produto: movimentacao.produto?.id ?? movimentacao.produto,
            tipo: movimentacao.tipo,
            quantidade: movimentacao.quantidade,
            observacao: movimentacao.observacao || ''
        }
    } else {
        isEditing.value = false
        form.value = {
            ...defaultForm,
            produto: produtoIdInicial || Number(route.query?.produto_id) || null
        }
    }
    dialog.value = true
}

// ESCRITA
const { mutateAsync: saveMovimentacaoMutation, isPending: saving } = useMutation({
    mutationFn: async ({ formData, isEditing }) => {
        const payload = {
            produto: formData.produto,
            tipo: formData.tipo,
            quantidade: formData.quantidade,
            observacao: formData.observacao || null
        }
        if (isEditing) {
            const response = await api.put(`/movimentacoes/${formData.id}/`, payload)
            return response.data
        } else {
            const response = await api.post('/movimentacoes/', payload)
            return response.data
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
        queryClient.invalidateQueries({ queryKey: ['estoque', 'resumo'] })
    }
})

const saveMovimentacao = async () => {
    try {
        await saveMovimentacaoMutation({ formData: form.value, isEditing: isEditing.value })

        $q.notify({
            color: 'positive',
            message: isEditing.value ? 'Movimentação atualizada com sucesso!' : 'Movimentação registrada com sucesso!',
            icon: 'check'
        })
        dialog.value = false
    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.non_field_errors?.[0] || Object.values(data || {})[0]?.[0] || 'Erro ao salvar movimentação'
        $q.notify({
            color: 'negative',
            message: errorMsg,
            icon: 'error'
        })
    }
}

// EXCLUSÃO
const { mutateAsync: deleteMovimentacaoMutation } = useMutation({
    mutationFn: async (id) => {
        await api.delete(`/movimentacoes/${id}/`)
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
        queryClient.invalidateQueries({ queryKey: ['produtos'] })
        queryClient.invalidateQueries({ queryKey: ['estoque', 'resumo'] })
    }
})

const confirmDelete = (movimentacao) => {
    const prodName = movimentacao.produto?.nome || `ID ${movimentacao.produto}`

    $q.dialog({
        title: 'Excluir Movimentação?',
        message: `Deseja realmente excluir esta movimentação de ${movimentacao.tipo} do produto "${prodName}"? Essa ação reverterá a quantidade no estoque.`,
        cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
        ok: { label: 'Excluir', color: 'negative', unelevated: true },
        persistent: true
    }).onOk(async () => {
        try {
            await deleteMovimentacaoMutation(movimentacao.id)
            $q.notify({ color: 'positive', message: 'Movimentação excluída com sucesso', icon: 'delete' })
        } catch (error) {
            $q.notify({
                color: 'negative',
                message: error.response?.data?.detail || 'Erro ao excluir movimentação',
                icon: 'error'
            })
        }
    })
}
</script>