<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Vendas" icon="point_of_sale" to="/vendas" />
            <q-breadcrumbs-el label="Contas a Receber" icon="account_balance_wallet" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md page-header">
            <div class="text-h5 text-weight-bold">Contas a Receber</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Nova Conta" @click="openDialog()" class="q-ml-sm new-order-btn" />
        </div>

        <!-- Barra de Ferramentas (Busca e Filtros) -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row q-col-gutter-sm items-center q-py-sm">
                <div class="col-12 col-sm-8 col-md-6">
                    <q-input v-model="search" dense outlined placeholder="Buscar por cliente ou nº do pedido...">
                        <template v-slot:prepend>
                            <q-icon name="search" />
                        </template>
                        <template v-slot:append>
                            <q-icon v-if="search" name="clear" class="cursor-pointer" @click="search = ''" />
                        </template>
                    </q-input>
                </div>
                <div class="col-12 col-sm-4 col-md-3">
                    <q-select v-model="filterStatus" :options="statusOptions" emit-value map-options dense outlined
                        label="Status" clearable />
                </div>
            </q-card-section>
        </q-card>

        <!-- Tabela de Contas -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredContas" :columns="columns" row-key="id" :loading="loading"
                :pagination="{ rowsPerPage: 15 }" flat class="responsive-table">

                <template v-slot:body-cell-conta="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">Pedido #{{ props.row.pedido_id || props.row.pedido || 'N/A' }}
                        </div>
                        <div class="text-caption text-grey-7">
                            {{ props.row.cliente_nome || 'Cliente não informado' }} ·
                            Parcela {{ props.row.numero_parcela }}/{{ props.row.total_parcelas }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-vencimento="props">
                    <q-td :props="props">
                        <div :class="isVencida(props.row) ? 'text-negative text-weight-bold' : 'text-grey-8'">
                            {{ formatDate(props.row.vencimento) }}
                        </div>
                        <q-badge v-if="isVencida(props.row)" color="negative" class="q-mt-xs" label="Vencida" />
                    </q-td>
                </template>

                <template v-slot:body-cell-valores="props">
                    <q-td :props="props">
                        <div class="text-weight-bold">R$ {{ formatCurrency(props.row.valor) }}</div>
                        <div v-if="props.row.status !== 'paga' && props.row.status !== 'cancelada'"
                            class="text-caption text-orange">
                            Restante: R$ {{ formatCurrency((props.row.valor || 0) - (props.row.valor_pago || 0)) }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-status="props">
                    <q-td :props="props">
                        <q-badge :color="getStatusColor(props.row.status)" outline>
                            {{ formatStatus(props.row.status) }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-acoes="props">
                    <q-td :props="props" class="text-center">
                        <q-btn v-if="props.row.status === 'pendente'" flat round color="positive" icon="payments"
                            size="sm" @click="openDialog(props.row, true)">
                            <q-tooltip>Registrar Pagamento</q-tooltip>
                        </q-btn>
                        <q-btn v-if="props.row.status === 'pendente'" flat round color="primary" icon="edit" size="sm"
                            @click="openDialog(props.row)">
                            <q-tooltip>Editar</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="negative" icon="delete" size="sm" @click="confirmDelete(props.row)">
                            <q-tooltip>Excluir</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- Diálogo de Cadastro / Registro de Pagamento -->
        <q-dialog v-model="dialog" persistent maximized>
            <q-card class="q-pa-sm q-pa-md-sm conta-dialog-card">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">
                        {{ isPaymentMode ? 'Registrar Pagamento' : (isEditing ? 'Editar' : 'Nova') }} Conta
                    </div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-md">
                    <q-form @submit="saveConta" class="q-gutter-md">

                        <!-- Campos visíveis apenas na criação/edição completa -->
                        <template v-if="!isPaymentMode">
                            <q-select v-model="form.pedido" :options="pedidosOptions" emit-value map-options outlined
                                dense label="Pedido Vinculado *" :rules="[val => !!val || 'Pedido é obrigatório']" />
                            <div class="row q-col-gutter-md">
                                <div class="col-12 col-sm-6">
                                    <q-input v-model.number="form.numero_parcela" label="Parcela *" type="number"
                                        min="1" outlined dense :rules="[val => val >= 1 || 'Mínimo 1']" />
                                </div>
                                <div class="col-12 col-sm-6">
                                    <q-input v-model.number="form.total_parcelas" label="Total de Parcelas *"
                                        type="number" min="1" outlined dense
                                        :rules="[val => val >= form.numero_parcela || 'Total deve ser >= parcela atual']" />
                                </div>
                            </div>
                            <q-input v-model.number="form.valor" label="Valor Total da Parcela (R$) *" type="number"
                                step="0.01" min="0.01" outlined dense prefix="R$"
                                :rules="[val => val > 0 || 'Valor deve ser maior que zero']" />
                            <q-input v-model="form.vencimento" label="Data de Vencimento *" type="date" outlined dense
                                :rules="[val => !!val || 'Vencimento é obrigatório']" />
                        </template>

                        <!-- Campos de Pagamento -->
                        <q-separator v-if="isPaymentMode || form.status === 'paga'" class="q-my-md" />

                        <div v-if="isPaymentMode || form.status === 'paga'"
                            class="q-pa-md bg-positive/10 rounded-borders">
                            <div class="text-subtitle2 text-positive q-mb-sm">Dados do Pagamento</div>
                            <div class="row q-col-gutter-md">
                                <div class="col-12 col-sm-6">
                                    <q-select v-model="form.meio_pagamento" :options="meioPagamentoOptions" emit-value
                                        map-options outlined dense label="Meio de Pagamento *"
                                        :rules="[val => !!val || 'Meio de pagamento é obrigatório']" />
                                </div>
                                <div class="col-12 col-sm-6">
                                    <q-input v-model.number="form.valor_pago" label="Valor Pago (R$) *" type="number"
                                        step="0.01" min="0" outlined dense prefix="R$" :rules="[
                                            val => val > 0 || 'Valor pago deve ser maior que zero',
                                            val => val <= (form.valor || 0) || 'Valor pago não pode exceder o valor da parcela'
                                        ]" />
                                </div>
                            </div>
                        </div>

                        <q-input v-model="form.observacao" label="Observação" type="textarea" outlined dense rows="2" />

                        <div class="row justify-end q-mt-md">
                            <q-btn label="Cancelar" color="grey-7" flat v-close-popup class="q-mr-sm" />
                            <q-btn :label="isPaymentMode ? 'Confirmar Pagamento' : (isEditing ? 'Salvar' : 'Criar')"
                                :color="isPaymentMode ? 'positive' : 'primary'" type="submit" :loading="saving" />
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
const filterStatus = ref(null)
const dialog = ref(false)
const isEditing = ref(false)
const isPaymentMode = ref(false)

const defaultForm = {
    id: null,
    pedido: null,
    numero_parcela: 1,
    total_parcelas: 1,
    valor: 0.00,
    valor_pago: 0.00,
    vencimento: '',
    meio_pagamento: null,
    status: 'pendente',
    observacao: ''
}
const form = ref({ ...defaultForm })

// --- Opções ---
const statusOptions = [
    { label: 'Pendente', value: 'pendente' },
    { label: 'Paga', value: 'paga' },
    { label: 'Cancelada', value: 'cancelada' }
]

const meioPagamentoOptions = [
    { label: 'Dinheiro', value: 'dinheiro' },
    { label: 'Pix', value: 'pix' },
    { label: 'Cartão de Débito', value: 'cartao_debito' },
    { label: 'Cartão de Crédito', value: 'cartao_credito' },
    { label: 'Boleto', value: 'boleto' },
    { label: 'Transferência', value: 'transferencia' },
    { label: 'Outro', value: 'outro' }
]

const columns = [
    { name: 'conta', label: 'Conta', field: row => row.pedido_id || row.pedido, align: 'left', sortable: true },
    { name: 'vencimento', label: 'Vencimento', field: 'vencimento', align: 'left', sortable: true },
    { name: 'valores', label: 'Valor', field: 'valor', align: 'left', sortable: true },
    { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
    { name: 'acoes', label: 'Ações', field: 'id', align: 'right' }
]

// ==========================================
// 1. VUE QUERY: LEITURA (GET)
// ==========================================
// Query para Pedidos (usada para popular o select)
const { data: pedidos } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
        const response = await api.get('/pedidos/')
        return response.data
    }
})

// Query para Contas a Receber (substitui `loading` e `contas` manuais)
const {
    data: contas,
    isLoading: loading // Renomeado para manter compatibilidade com seu template
} = useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => {
        const response = await api.get('/contas-receber/')
        return response.data
    }
})

// --- Computed ---
const pedidosOptions = computed(() => {
    // Fallback para [] caso os dados ainda estejam carregando
    return (pedidos.value || []).map(p => ({ label: `Pedido #${p.id} - ${p.cliente?.nome || 'N/A'}`, value: p.id }))
})

const filteredContas = computed(() => {
    // Fallback para [] caso os dados ainda estejam carregando
    let result = contas.value || []

    if (search.value) {
        const term = search.value.toLowerCase()
        result = result.filter(c =>
            (c.pedido_id || c.pedido)?.toString().includes(term) ||
            (c.cliente_nome && c.cliente_nome.toLowerCase().includes(term))
        )
    }

    if (filterStatus.value) {
        result = result.filter(c => c.status === filterStatus.value)
    }

    return result
})

// --- Métodos Auxiliares ---
const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0,00'
    return parseFloat(value).toFixed(2).replace('.', ',')
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
}

const isVencida = (conta) => {
    if (conta.status !== 'pendente' || !conta.vencimento) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const vencimento = new Date(conta.vencimento)
    return vencimento < today
}

const formatStatus = (status) => {
    const found = statusOptions.find(s => s.value === status)
    return found ? found.label : status
}

const getStatusColor = (status) => {
    const colors = {
        pendente: 'warning',
        paga: 'positive',
        cancelada: 'negative'
    }
    return colors[status] || 'grey'
}

// --- Ações de UI ---
const openDialog = (conta = null, paymentMode = false) => {
    isPaymentMode.value = paymentMode

    if (conta) {
        isEditing.value = true
        // Formata a data para o input type="date" (YYYY-MM-DD)
        const dataVencimento = conta.vencimento ? new Date(conta.vencimento).toISOString().split('T')[0] : ''

        form.value = {
            ...conta,
            vencimento: dataVencimento
        }

        // Se for modo pagamento, sugere o valor restante a ser pago
        if (paymentMode) {
            const restante = (conta.valor || 0) - (conta.valor_pago || 0)
            form.value.valor_pago = restante > 0 ? restante : conta.valor
        }
    } else {
        isEditing.value = false
        form.value = {
            ...defaultForm,
            vencimento: new Date().toISOString().split('T')[0]
        }
    }
    dialog.value = true
}

const confirmDelete = (conta) => {
    if (conta.status === 'paga') {
        $q.notify({ color: 'negative', message: 'Não é possível excluir uma conta já paga.', icon: 'block' })
        return
    }

    $q.dialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir a parcela ${conta.numero_parcela}/${conta.total_parcelas} do Pedido #${conta.pedido_id || conta.pedido}?`,
        cancel: true,
        persistent: true
    }).onOk(async () => {
        await deletarConta(conta.id)
    })
}

// ==========================================
// 2. VUE QUERY: ESCRITA (POST / PUT)
// ==========================================
const { mutateAsync: saveContaMutation, isPending: saving } = useMutation({
    mutationFn: async (payload) => {
        if (payload.id) {
            const response = await api.put(`/contas-receber/${payload.id}/`, payload)
            return response.data
        } else {
            const response = await api.post('/contas-receber/', payload)
            return response.data
        }
    },
    onSuccess: () => {
        // Invalida o cache para a tabela atualizar automaticamente
        queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
    }
})

const saveConta = async () => {
    try {
        const payload = { ...form.value }
        if (isPaymentMode.value) {
            payload.status = 'paga'
        }

        await saveContaMutation(payload)

        $q.notify({
            color: 'positive',
            message: isPaymentMode.value ? 'Pagamento registrado com sucesso!' : (isEditing.value ? 'Conta atualizada!' : 'Conta criada com sucesso!'),
            icon: 'check'
        })
        dialog.value = false
    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.non_field_errors?.[0] || Object.values(data || {})[0]?.[0] || 'Erro ao salvar conta'

        $q.notify({
            color: 'negative',
            message: errorMsg,
            icon: 'error',
            timeout: 5000
        })
    }
}

// ==========================================
// 3. VUE QUERY: EXCLUSÃO (DELETE)
// ==========================================
const { mutateAsync: deleteContaMutation } = useMutation({
    mutationFn: async (id) => {
        await api.delete(`/contas-receber/${id}/`)
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
    }
})

const deletarConta = async (id) => {
    try {
        await deleteContaMutation(id)
        $q.notify({ color: 'positive', message: 'Conta excluída com sucesso', icon: 'delete' })
    } catch (error) {
        $q.notify({
            color: 'negative',
            message: error.response?.data?.detail || 'Erro ao excluir conta',
            icon: 'error'
        })
    }
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

.conta-dialog-card {
    max-width: 700px;
    width: 100%;
    margin: auto;
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

    .conta-dialog-card {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
        margin: 0;
    }
}
</style>