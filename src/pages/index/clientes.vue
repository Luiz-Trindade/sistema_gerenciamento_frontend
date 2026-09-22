<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Clientes" icon="people" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md q-col-gutter-sm">
            <div class="col-12 col-sm">
                <div class="text-h5 text-weight-bold">Clientes</div>
            </div>
            <div class="col-12 col-sm-auto">
                <q-btn color="primary" icon="add" label="Novo Cliente" no-caps @click="openDialog()"
                    :class="$q.screen.lt.sm ? 'full-width' : ''" />
            </div>
        </div>

        <!-- Barra de Ferramentas (Busca) -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm">
                <q-input v-model="filter" dense outlined placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..."
                    class="col-12 col-sm-8 col-md-6">
                    <template v-slot:prepend>
                        <q-icon name="search" />
                    </template>
                    <template v-slot:append>
                        <q-icon v-if="filter" name="clear" class="cursor-pointer" @click="filter = ''" />
                    </template>
                </q-input>
            </q-card-section>
        </q-card>

        <!-- Tabela de Clientes -->
        <q-card bordered class="no-shadow">
            <q-table :rows="filteredClientes" :columns="columns" row-key="id" :loading="loading" dense flat
                separator="horizontal" :pagination="{ rowsPerPage: 10 }" class="full-width">

                <!-- Coluna: Nome + trecho da descrição + ícone de info -->
                <template v-slot:body-cell-nome="props">
                    <q-td :props="props">
                        <div class="row items-center no-wrap">
                            <div class="ellipsis" :style="{ maxWidth: '240px' }">
                                <span class="text-weight-medium">{{ props.row.nome }}</span>
                            </div>
                            <q-btn v-if="props.row.descricao" flat round dense size="sm" color="primary" icon="info"
                                class="q-ml-xs">
                                <q-tooltip>Ver descrição</q-tooltip>
                                <q-menu anchor="bottom left" self="top left" :offset="[0, 4]"
                                    class="cliente-descricao-menu">
                                    <q-card flat style="max-width: 360px;">
                                        <q-card-section class="row items-center q-pb-none q-pt-sm">
                                            <q-icon name="description" color="primary" size="20px" class="q-mr-xs" />
                                            <div class="text-subtitle2 text-weight-bold">Descrição</div>
                                        </q-card-section>
                                        <q-separator class="q-my-sm" />
                                        <q-card-section class="q-pt-none q-pb-sm">
                                            <!-- Popover: limite maior (400) e quebra de linha preservada -->
                                            <div class="text-body2" style="white-space: pre-wrap;">
                                                {{ truncar(props.row.descricao, LIMITE_DESCRICAO_POPOVER) }}
                                            </div>
                                        </q-card-section>
                                    </q-card>
                                </q-menu>
                            </q-btn>
                        </div>
                        <!-- Trecho da tabela: limite curto (80) com reticências -->
                        <div v-if="props.row.descricao" class="text-caption text-grey-7 q-mt-xs">
                            {{ truncar(props.row.descricao, LIMITE_DESCRICAO_TABELA) }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-documento="props">
                    <q-td :props="props">
                        <div v-if="props.row.cpf">CPF: {{ props.row.cpf }}</div>
                        <div v-if="props.row.cnpj">CNPJ: {{ props.row.cnpj }}</div>
                        <span v-if="!props.row.cpf && !props.row.cnpj" class="text-grey-6">-</span>
                    </q-td>
                </template>

                <template v-slot:body-cell-contato="props">
                    <q-td :props="props">
                        <div class="text-weight-medium">{{ props.row.email || '-' }}</div>
                        <div class="text-caption text-grey-7">{{ props.row.telefone || '-' }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-status="props">
                    <q-td :props="props" class="text-center">
                        <q-badge :color="props.row.ativo ? 'positive' : 'grey-7'">
                            {{ props.row.ativo ? 'Ativo' : 'Inativo' }}
                        </q-badge>
                    </q-td>
                </template>

                <template v-slot:body-cell-acoes="props">
                    <q-td :props="props" class="text-center">
                        <q-btn flat round color="primary" icon="edit" size="sm" @click="openDialog(props.row)">
                            <q-tooltip>Editar</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="negative" icon="delete" size="sm"
                            @click="confirmarExclusao(props.row)">
                            <q-tooltip>Excluir</q-tooltip>
                        </q-btn>
                    </q-td>
                </template>

                <template v-slot:no-data="{ icon, message, filter }">
                    <div class="full-width row flex-center text-grey-7 q-pa-lg">
                        <q-icon size="2em" :name="filter ? 'search_off' : icon" />
                        <span class="q-ml-sm">
                            {{ filter ? 'Nenhum cliente encontrado.' : message }}
                        </span>
                    </div>
                </template>
            </q-table>
        </q-card>

        <!-- Diálogo de Cadastro/Edição -->
        <q-dialog v-model="dialog" persistent :maximized="$q.screen.lt.sm">
            <q-card class="column no-wrap" :style="$q.screen.lt.sm ? '' : 'width: 600px; max-width: 90vw;'">
                <q-card-section class="row items-center q-pb-none">
                    <q-icon :name="isEditing ? 'edit' : 'person_add'" color="primary" size="28px" class="q-mr-sm" />
                    <div class="text-h6">{{ isEditing ? 'Editar' : 'Novo' }} Cliente</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup :disable="saving" />
                </q-card-section>

                <q-card-section class="col scroll q-pt-md">
                    <q-form @submit="saveCliente" class="q-gutter-md">
                        <q-input v-model="form.nome" label="Nome / Razão Social *" outlined dense
                            :rules="[val => !!val || 'Nome é obrigatório']" :disable="saving" />

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-input v-model="form.cpf" label="CPF" outlined dense mask="###.###.###-##"
                                    unmasked-value :disable="saving" />
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input v-model="form.cnpj" label="CNPJ" outlined dense mask="##.###.###/####-##"
                                    unmasked-value :disable="saving" />
                            </div>
                        </div>

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-input v-model="form.email" label="E-mail" type="email" outlined dense :rules="[
                                    val => !val || /.+@.+\..+/.test(val) || 'E-mail inválido'
                                ]" :disable="saving" />
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input v-model="form.telefone" label="Telefone / Celular" outlined dense
                                    mask="(##) #####-####" unmasked-value :disable="saving" />
                            </div>
                        </div>

                        <q-input v-model="form.descricao" label="Descrição" type="textarea" outlined dense rows="3"
                            autogrow :disable="saving" :maxlength="LIMITE_DESCRICAO_INPUT"
                            :hint="`Informações adicionais (${form.descricao?.length || 0}/${LIMITE_DESCRICAO_INPUT} caracteres).`" />

                        <div class="row items-center q-mt-sm">
                            <q-toggle v-model="form.ativo" label="Cliente Ativo" color="positive" :disable="saving" />
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

        <!-- Diálogo de Confirmação de Exclusão -->
        <q-dialog v-model="dialogExclusao" persistent :maximized="$q.screen.lt.sm">
            <q-card :style="$q.screen.lt.sm ? '' : 'min-width: 350px; max-width: 500px;'">
                <q-card-section class="row items-center q-pb-none">
                    <q-avatar icon="warning" color="negative" text-color="white" class="q-mr-sm" />
                    <div class="text-h6">Excluir Cliente?</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-md">
                    <div class="text-body1">
                        Tem certeza que deseja excluir o cliente <strong>{{ clienteParaExcluir?.nome }}</strong>?
                    </div>
                    <div class="text-caption text-grey-7 q-mt-sm">
                        Esta ação não pode ser desfeita e pode impactar pedidos ou contas vinculadas.
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pb-md q-pr-md q-col-gutter-sm">
                    <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                        <q-btn label="Cancelar" color="grey-7" flat v-close-popup no-caps
                            :class="$q.screen.lt.sm ? 'full-width' : 'q-mr-sm'" />
                    </div>
                    <div :class="$q.screen.lt.sm ? 'col-12' : ''">
                        <q-btn label="Excluir" color="negative" unelevated :loading="deleting" no-caps
                            :class="$q.screen.lt.sm ? 'full-width' : ''" @click="deletarCliente" />
                    </div>
                </q-card-actions>
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

// ==========================================
// LIMITES DE CARACTERES
// ==========================================
const LIMITE_DESCRICAO_TABELA = 30      // trecho exibido abaixo do nome
const LIMITE_DESCRICAO_POPOVER = 500    // texto exibido no popover
const LIMITE_DESCRICAO_INPUT = 1500     // máximo aceito no campo (alinhado ao backend, se houver)

/**
 * Trunca um texto em `limite` caracteres, adicionando "…" no final
 * se houver corte. Preserva palavras inteiras quando possível.
 */
const truncar = (texto, limite) => {
    if (!texto) return ''
    const str = String(texto).trim()
    if (str.length <= limite) return str

    // Corta no último espaço antes do limite para não quebrar palavra no meio
    const cortado = str.slice(0, limite)
    const ultimoEspaco = cortado.lastIndexOf(' ')
    const base = ultimoEspaco > limite * 0.6 ? cortado.slice(0, ultimoEspaco) : cortado
    return base.trimEnd() + '…'
}

// --- Estado Local (Apenas para controle de UI) ---
const filter = ref('')
const dialog = ref(false)
const isEditing = ref(false)
const dialogExclusao = ref(false)
const clienteParaExcluir = ref(null)

const defaultForm = {
    id: null,
    nome: '',
    email: '',
    telefone: '',
    descricao: '',
    cpf: '',
    cnpj: '',
    ativo: true
}
const form = ref({ ...defaultForm })

// --- Colunas da Tabela ---
const columns = [
    { name: 'nome', label: 'Nome / Razão Social', field: 'nome', align: 'left', sortable: true },
    { name: 'documento', label: 'CPF / CNPJ', field: 'cpf', align: 'left', sortable: false },
    { name: 'contato', label: 'Contato', field: 'email', align: 'left' },
    { name: 'status', label: 'Status', field: 'ativo', align: 'center', sortable: true },
    { name: 'acoes', label: 'Ações', align: 'center' }
]

// ==========================================
// 1. VUE QUERY: LEITURA (GET)
// ==========================================
const {
    data: clientes,
    isLoading: loading
} = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
        const response = await api.get('/clientes/')
        return response.data
    }
})

// --- Computed (Filtro) ---
const filteredClientes = computed(() => {
    const lista = clientes.value || []
    if (!filter.value) return lista

    const term = filter.value.toLowerCase()
    return lista.filter(c =>
        c.nome?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.cpf?.toLowerCase().includes(term) ||
        c.cnpj?.toLowerCase().includes(term) ||
        c.telefone?.toLowerCase().includes(term) ||
        c.descricao?.toLowerCase().includes(term)
    )
})

// --- Ações de UI ---
const openDialog = (cliente = null) => {
    if (cliente) {
        isEditing.value = true
        form.value = {
            id: cliente.id,
            nome: cliente.nome ?? '',
            email: cliente.email ?? '',
            telefone: cliente.telefone ?? '',
            descricao: cliente.descricao ?? '',
            cpf: cliente.cpf ?? '',
            cnpj: cliente.cnpj ?? '',
            ativo: cliente.ativo ?? true
        }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm }
    }
    dialog.value = true
}

const confirmarExclusao = (cliente) => {
    clienteParaExcluir.value = cliente
    dialogExclusao.value = true
}

// ==========================================
// 2. VUE QUERY: ESCRITA (POST / PUT)
// ==========================================
const { mutateAsync: saveClienteMutation, isPending: saving } = useMutation({
    mutationFn: async ({ formData, isEditing }) => {
        const payload = {
            ...formData,
            email: formData.email || null,
            cpf: formData.cpf || null,
            cnpj: formData.cnpj || null,
            telefone: formData.telefone || null,
            descricao: formData.descricao || null
        }

        if (isEditing) {
            const response = await api.put(`/clientes/${payload.id}/`, payload)
            return response.data
        } else {
            const response = await api.post('/clientes/', payload)
            return response.data
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] })
    }
})

const saveCliente = async () => {
    try {
        await saveClienteMutation({ formData: form.value, isEditing: isEditing.value })

        $q.notify({
            color: 'positive',
            message: isEditing.value ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!',
            icon: 'check'
        })
        dialog.value = false
    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.non_field_errors?.[0] || Object.values(data || {})[0]?.[0] || 'Erro ao salvar cliente'

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
const { mutateAsync: deleteClienteMutation, isPending: deleting } = useMutation({
    mutationFn: async (id) => {
        await api.delete(`/clientes/${id}/`)
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] })
    }
})

const deletarCliente = async () => {
    if (!clienteParaExcluir.value) return

    try {
        await deleteClienteMutation(clienteParaExcluir.value.id)

        $q.notify({ color: 'positive', message: 'Cliente excluído com sucesso', icon: 'delete' })
        dialogExclusao.value = false
        clienteParaExcluir.value = null
    } catch (error) {
        $q.notify({
            color: 'negative',
            message: error.response?.data?.detail || 'Erro ao excluir cliente. Ele pode estar vinculado a outros registros.',
            icon: 'error',
            timeout: 6000
        })
    }
}
</script>

<style scoped>
:deep(.q-td) {
    white-space: normal;
}

/* Popover de descrição: limita a largura e adiciona leve sombra */
.cliente-descricao-menu {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
}
</style>