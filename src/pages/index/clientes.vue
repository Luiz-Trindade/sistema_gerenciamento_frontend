<template>
    <q-page class="q-pa-sm q-pa-md-sm">
        <!-- Breadcrumbs -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Clientes" icon="people" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md page-header">
            <div class="text-h5 text-weight-bold">Clientes</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Novo Cliente" @click="openDialog()"
                class="q-ml-sm new-order-btn" />
        </div>

        <!-- Barra de Ferramentas (Busca) -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm">
                <q-input v-model="filter" dense outlined placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
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
                separator="horizontal" :pagination="{ rowsPerPage: 10 }" class="responsive-table">

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
        <q-dialog v-model="dialog" persistent maximized>
            <q-card class="q-pa-sm q-pa-md-sm cliente-dialog-card">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h6">{{ isEditing ? 'Editar' : 'Novo' }} Cliente</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>

                <q-card-section class="q-pt-md">
                    <q-form @submit="saveCliente" class="q-gutter-md">
                        <q-input v-model="form.nome" label="Nome / Razão Social *" outlined dense
                            :rules="[val => !!val || 'Nome é obrigatório']" />

                        <div class="row q-col-gutter-md">
                            <div class="col-12 col-sm-6">
                                <q-input v-model="form.documento" label="CPF / CNPJ *" outlined dense
                                    :rules="[val => !!val || 'Documento é obrigatório']" />
                            </div>
                            <div class="col-12 col-sm-6">
                                <q-input v-model="form.telefone" label="Telefone / Celular" outlined dense
                                    mask="(##) #####-####" unmasked-value />
                            </div>
                        </div>

                        <q-input v-model="form.email" label="E-mail *" type="email" outlined dense :rules="[
                            val => !!val || 'E-mail é obrigatório',
                            val => /.+@.+\..+/.test(val) || 'E-mail inválido'
                        ]" />

                        <div class="row items-center q-mt-sm">
                            <q-toggle v-model="form.ativo" label="Cliente Ativo" color="positive" />
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

        <!-- Diálogo de Confirmação de Exclusão -->
        <q-dialog v-model="dialogExclusao" persistent>
            <q-card style="min-width: 350px">
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
                        Esta ação não pode ser desfeita e pode impactos em pedidos ou contas vinculadas.
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pb-md q-pr-md">
                    <q-btn label="Cancelar" color="grey-7" flat v-close-popup class="q-mr-sm" />
                    <q-btn label="Excluir" color="negative" unelevated :loading="deleting" @click="deletarCliente" />
                </q-card-actions>
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
const deleting = ref(false)
const filter = ref('')
const dialog = ref(false)
const isEditing = ref(false)
const dialogExclusao = ref(false)

const clientes = ref([])
const clienteParaExcluir = ref(null)

const defaultForm = {
    id: null,
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    ativo: true
}
const form = ref({ ...defaultForm })

// --- Colunas da Tabela ---
const columns = [
    { name: 'nome', label: 'Nome / Razão Social', field: 'nome', align: 'left', sortable: true },
    { name: 'documento', label: 'CPF / CNPJ', field: 'documento', align: 'left', sortable: true },
    { name: 'contato', label: 'Contato', field: 'email', align: 'left' },
    { name: 'status', label: 'Status', field: 'ativo', align: 'center', sortable: true },
    { name: 'acoes', label: 'Ações', align: 'center' }
]

// --- Computed (Filtro) ---
const filteredClientes = computed(() => {
    if (!filter.value) return clientes.value
    const term = filter.value.toLowerCase()
    return clientes.value.filter(c =>
        c.nome?.toLowerCase().includes(term) ||
        c.documento?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
    )
})

// --- API Calls ---
const fetchClientes = async () => {
    loading.value = true
    try {
        const response = await api.get('/clientes/')
        clientes.value = response.data
    } catch (error) {
        $q.notify({
            color: 'negative',
            message: error.response?.data?.detail || 'Erro ao carregar clientes',
            icon: 'error'
        })
    } finally {
        loading.value = false
    }
}

// --- Ações do Usuário ---
const openDialog = (cliente = null) => {
    if (cliente) {
        isEditing.value = true
        form.value = { ...cliente }
    } else {
        isEditing.value = false
        form.value = { ...defaultForm }
    }
    dialog.value = true
}

const saveCliente = async () => {
    saving.value = true
    try {
        if (isEditing.value) {
            await api.put(`/clientes/${form.value.id}/`, form.value)
            $q.notify({ color: 'positive', message: 'Cliente atualizado com sucesso!', icon: 'check' })
        } else {
            await api.post('/clientes/', form.value)
            $q.notify({ color: 'positive', message: 'Cliente cadastrado com sucesso!', icon: 'check' })
        }
        dialog.value = false
        fetchClientes()
    } catch (error) {
        const data = error.response?.data
        const errorMsg = data?.detail || data?.non_field_errors?.[0] || Object.values(data || {})[0]?.[0] || 'Erro ao salvar cliente'

        $q.notify({
            color: 'negative',
            message: errorMsg,
            icon: 'error',
            timeout: 5000
        })
    } finally {
        saving.value = false
    }
}

const confirmarExclusao = (cliente) => {
    clienteParaExcluir.value = cliente
    dialogExclusao.value = true
}

const deletarCliente = async () => {
    if (!clienteParaExcluir.value) return

    deleting.value = true
    try {
        await api.delete(`/clientes/${clienteParaExcluir.value.id}/`)
        $q.notify({ color: 'positive', message: 'Cliente excluído com sucesso', icon: 'delete' })
        dialogExclusao.value = false
        clienteParaExcluir.value = null
        fetchClientes()
    } catch (error) {
        $q.notify({
            color: 'negative',
            message: error.response?.data?.detail || 'Erro ao excluir cliente. Ele pode estar vinculado a outros registros.',
            icon: 'error',
            timeout: 6000
        })
    } finally {
        deleting.value = false
    }
}

// --- Lifecycle ---
onMounted(() => {
    fetchClientes()
})
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

/* Garante que o texto nas células quebre linha se necessário */
:deep(.q-td) {
    white-space: normal;
}

/* Estilização para o Dialog Maximized ficar elegante e centralizado */
.cliente-dialog-card {
    max-width: 600px;
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

    .cliente-dialog-card {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
        margin: 0;
    }
}
</style>