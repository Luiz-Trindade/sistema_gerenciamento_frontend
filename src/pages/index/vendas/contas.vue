<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Vendas" icon="point_of_sale" to="/vendas" />
            <q-breadcrumbs-el label="Contas a Receber" icon="account_balance_wallet" />
        </q-breadcrumbs>

        <!-- Cabeçalho -->
        <div class="row items-center q-mb-md page-header">
            <div>
                <div class="text-h5 text-weight-bold">Contas a Receber</div>
                <div class="text-caption text-grey-7">Acompanhamento de parcelas, prazos de vencimento e quitações</div>
            </div>
            <q-space />
            <q-btn color="primary" icon="add" label="Nova Conta" no-caps @click="openDialog()"
                class="q-ml-sm new-order-btn" :class="$q.screen.lt.sm ? 'full-width q-mt-sm' : ''" />
        </div>

        <!-- Barra de Filtros -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row q-col-gutter-sm items-center q-py-sm">
                <div class="col-12 col-sm-8 col-md-6">
                    <q-input v-model="search" dense outlined placeholder="Buscar por cliente ou nº do pedido...">
                        <template #prepend>
                            <q-icon name="search" />
                        </template>
                        <template #append>
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

        <!-- Tabela -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredContas" :columns="columns" row-key="id" :loading="loading" dense flat
                :pagination="{ rowsPerPage: 15, sortBy: 'vencimento', descending: false }" separator="horizontal"
                class="full-width">

                <template #body-cell-conta="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">Pedido #{{ props.row.pedido_id || props.row.pedido || 'N/A' }}
                        </div>
                        <div class="text-caption text-grey-7">
                            {{ props.row.cliente_nome || 'Cliente não informado' }} · Parcela {{
                            props.row.numero_parcela }}/{{ props.row.total_parcelas }}
                        </div>
                    </q-td>
                </template>

                <template #body-cell-vencimento="props">
                    <q-td :props="props">
                        <div :class="isVencida(props.row) ? 'text-negative text-weight-bold' : 'text-grey-8'">
                            {{ formatDate(props.row.vencimento) }}
                        </div>
                        <q-badge v-if="isVencida(props.row)" color="negative" class="q-mt-xs" label="Vencida" />
                    </q-td>
                </template>

                <template #body-cell-valores="props">
                    <q-td :props="props">
                        <div class="text-weight-bold">R$ {{ formatCurrency(props.row.valor) }}</div>
                        <div v-if="props.row.status !== 'paga' && props.row.status !== 'cancelada'"
                            class="text-caption text-orange-9">
                            Restante: R$ {{ formatCurrency((props.row.valor || 0) - (props.row.valor_pago || 0)) }}
                        </div>
                    </q-td>
                </template>

                <template #body-cell-status="props">
                    <q-td :props="props">
                        <q-badge :color="getStatusColor(props.row.status)" outline class="q-pa-xs">
                            {{ formatStatus(props.row.status) }}
                        </q-badge>
                    </q-td>
                </template>

                <template #body-cell-acoes="props">
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

                <template #no-data="{ icon, message, filter }">
                    <div class="full-width row flex-center text-grey-7 q-pa-lg">
                        <q-icon size="2em" :name="filter ? 'search_off' : icon" />
                        <span class="q-ml-sm">
                            {{ filter ? 'Nenhuma conta encontrada.' : message }}
                        </span>
                    </div>
                </template>
            </q-table>
        </q-card>

        <!-- Diálogo de Edição / Pagamento -->
        <q-dialog v-model="dialog" persistent :maximized="$q.screen.lt.sm">
            <q-card class="column no-wrap" :style="$q.screen.lt.sm ? '' : 'width: 550px; max-width: 90vw;'">
                <q-card-section class="row items-center q-pb-none">
                    <q-icon :name="isPaymentMode ? 'payments' : 'account_balance_wallet'"
                        :color="isPaymentMode ? 'positive' : 'primary'" size="28px" class="q-mr-sm" />
                    <div class="text-h6">
                        {{ isPaymentMode ? 'Registrar Pagamento' : (isEditing ? 'Editar' : 'Nova') }} Conta
                    </div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup :disable="saving" />
                </q-card-section>

                <q-card-section class="col scroll q-pt-md">
                    <q-form @submit="saveConta" class="q-gutter-md">
                        <template v-if="!isPaymentMode">
                            <q-select v-model="form.pedido" :options="pedidosOptions" emit-value map-options outlined
                                dense label="Pedido Vinculado *" :rules="[val => !!val || 'Pedido é obrigatório']"
                                :disable="saving || isEditing" use-input input-debounce="200" />
                            <div class="row q-col-gutter-md">
                                <div class="col-12 col-sm-6">
                                    <q-input v-model.number="form.numero_parcela" label="Parcela *" type="number"
                                        min="1" outlined dense :rules="[val => val >= 1 || 'Mínimo 1']"
                                        :disable="saving" />
                                </div>
                                <div class="col-12 col-sm-6">
                                    <q-input v-model.number="form.total_parcelas" label="Total de Parcelas *"
                                        type="number" min="1" outlined dense
                                        :rules="[val => val >= form.numero_parcela || 'Total deve ser >= parcela atual']"
                                        :disable="saving" />
                                </div>
                            </div>
                            <q-input v-model.number="form.valor" label="Valor Total da Parcela (R$) *" type="number"
                                step="0.01" min="0.01" outlined dense prefix="R$"
                                :rules="[val => val > 0 || 'Valor deve ser maior que zero']" :disable="saving" />
                            <q-input v-model="form.vencimento" label="Data de Vencimento *" type="date" outlined dense
                                :rules="[val => !!val || 'Vencimento é obrigatório']" :disable="saving" />
                        </template>

                        <div v-if="isPaymentMode || form.status === 'paga'"
                            class="q-pa-md bg-positive-1 rounded-borders">
                            <div class="text-subtitle2 text-positive q-mb-sm">Dados do Recebimento</div>
                            <div class="row q-col-gutter-md">
                                <div class="col-12 col-sm-6">
                                    <q-select v-model="form.meio_pagamento" :options="meioPagamentoOptions" emit-value
                                        map-options outlined dense label="Meio de Pagamento *"
                                        :rules="[val => !!val || 'Meio de pagamento é obrigatório']"
                                        :disable="saving" />
                                </div>
                                <div class="col-12 col-sm-6">
                                    <q-input v-model.number="form.valor_pago" label="Valor Pago (R$) *" type="number"
                                        step="0.01" min="0.01" outlined dense prefix="R$" :rules="[
                                            val => val > 0 || 'Valor pago deve ser maior que zero',
                                            val => val <= (form.valor || 0) || 'Valor pago não pode exceder o valor da parcela'
                                        ]" :disable="saving" />
                                </div>
                            </div>
                        </div>

                        <q-input v-model="form.observacao" label="Observação" type="textarea" outlined dense rows="2"
                            autogrow :disable="saving" />

                        <div class="row justify-end q-col-gutter-sm q-mt-md">
                            <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                                <q-btn label="Cancelar" color="grey-7" flat v-close-popup no-caps
                                    :class="$q.screen.lt.sm ? 'full-width' : 'q-mr-sm'" :disable="saving" />
                            </div>
                            <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                                <q-btn
                                    :label="isPaymentMode ? 'Confirmar Recebimento' : (isEditing ? 'Salvar' : 'Criar')"
                                    :color="isPaymentMode ? 'positive' : 'primary'" type="submit" no-caps
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const $q = useQuasar()
const route = useRoute()
const queryClient = useQueryClient()

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
    { name: 'acoes', label: 'Ações', align: 'center' }
]

const { data: pedidos } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => (await api.get('/pedidos/')).data
})

const { data: contas, isLoading: loading } = useQuery({
    queryKey: ['contas-receber'],
    queryFn: async () => (await api.get('/contas-receber/')).data
})

const pedidosOptions = computed(() => {
    return (pedidos.value || []).map(p => ({
        label: `Pedido #${p.id} - ${p.cliente?.nome || 'Consumidor Final'}`,
        value: p.id
    }))
})

const filteredContas = computed(() => {
    let result = contas.value || []

    if (search.value) {
        const term = search.value.toLowerCase()
        result = result.filter(c =>
            (c.pedido_id || c.pedido)?.toString().includes(term) ||
            (c.cliente_nome && c.cliente_nome.toLowerCase().includes(term))
        )
    }

    if (filterStatus.value) {
        if (filterStatus.value === 'vencidas') {
            result = result.filter(c => isVencida(c))
        } else {
            result = result.filter(c => c.status === filterStatus.value)
        }
    }

    return result
})

const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0,00'
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

const openDialog = (conta = null, paymentMode = false) => {
    isPaymentMode.value = paymentMode

    if (conta) {
        isEditing.value = true
        const dataVencimento = conta.vencimento ? new Date(conta.vencimento).toISOString().split('T')[0] : ''
        form.value = {
            ...conta,
            vencimento: dataVencimento
        }

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
        queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
        queryClient.invalidateQueries({ queryKey: ['vendas', 'resumo'] })
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
            message: isPaymentMode.value ? 'Pagamento registrado com sucesso!' : (isEditing.value ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!'),
            icon: 'check'
        })
        dialog.value = false
    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.non_field_errors?.[0] || Object.values(data || {})[0]?.[0] || 'Erro ao salvar conta'
        $q.notify({
            color: 'negative',
            message: errorMsg,
            icon: 'error'
        })
    }
}

const { mutateAsync: deleteContaMutation } = useMutation({
    mutationFn: async (id) => {
        await api.delete(`/contas-receber/${id}/`)
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
        queryClient.invalidateQueries({ queryKey: ['vendas', 'resumo'] })
    }
})

const confirmDelete = (conta) => {
    if (conta.status === 'paga') {
        $q.notify({ color: 'negative', message: 'Não é possível excluir uma conta já paga.', icon: 'block' })
        return
    }

    $q.dialog({
        title: 'Excluir Conta?',
        message: `Deseja realmente excluir a parcela ${conta.numero_parcela}/${conta.total_parcelas} do Pedido #${conta.pedido_id || conta.pedido}?`,
        cancel: { label: 'Cancelar', flat: true, color: 'grey-7' },
        ok: { label: 'Excluir', color: 'negative', unelevated: true },
        persistent: true
    }).onOk(async () => {
        try {
            await deleteContaMutation(conta.id)
            $q.notify({ color: 'positive', message: 'Conta excluída com sucesso', icon: 'delete' })
        } catch (error) {
            $q.notify({
                color: 'negative',
                message: error.response?.data?.detail || 'Erro ao excluir conta',
                icon: 'error'
            })
        }
    })
}

onMounted(() => {
    if (route.query?.filtro === 'vencidas') {
        filterStatus.value = 'vencidas'
    }
})
</script>