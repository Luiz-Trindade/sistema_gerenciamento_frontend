<template>
    <q-page class="q-ma-md">

        <!-- Breadcrumbs (Navegação estrutural) -->
        <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
            <q-breadcrumbs-el label="Início" icon="home" to="/" />
            <q-breadcrumbs-el label="Clientes" icon="people" />
        </q-breadcrumbs>

        <!-- Cabeçalho da Página -->
        <div class="row items-center q-mb-md">
            <div class="text-h5 text-weight-bold">Clientes</div>
            <q-space />
            <q-btn color="primary" icon="add" label="Novo Cliente" @click="criarCliente" class="q-ml-sm" />
        </div>

        <!-- Barra de Ferramentas (Busca) -->
        <q-card class="q-mb-md no-shadow" bordered>
            <q-card-section class="row items-center q-py-sm">
                <q-input v-model="filter" dense outlined placeholder="Buscar por nome, CPF ou CNPJ..."
                    class="col-12 col-sm-6">
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
            <q-table :rows="filteredClientes" :columns="columns" row-key="id" dense flat separator="horizontal"
                :pagination="{ rowsPerPage: 10 }">
                <!-- Template para colunas personalizadas -->
                <template v-slot:body-cell-contato="props">
                    <q-td :props="props">
                        <div>{{ props.row.email }}</div>
                        <div class="text-caption text-grey-7">{{ props.row.telefone }}</div>
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
                        <q-btn flat round color="primary" icon="visibility" size="sm"
                            @click="visualizarCliente(props.row)">
                            <q-tooltip>Visualizar</q-tooltip>
                        </q-btn>
                        <q-btn flat round color="orange" icon="edit" size="sm" @click="editarCliente(props.row)">
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
                        Tem certeza que deseja excluir o cliente <strong>{{ clienteSelecionado?.nome }}</strong>?
                    </div>
                    <div class="text-caption text-grey-7 q-mt-sm">
                        Esta ação não pode ser desfeita.
                    </div>
                </q-card-section>

                <q-card-actions align="right" class="q-pb-md q-pr-md">
                    <q-btn label="Cancelar" color="grey-7" flat v-close-popup class="q-mr-sm" />
                    <q-btn label="Excluir" color="negative" unelevated @click="deletarCliente" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const filter = ref('')
const dialogExclusao = ref(false)
const clienteSelecionado = ref(null)

const clientes = ref([
    { id: 1, nome: 'Luiz Gabriel Trindade', documento: '123.456.789-00', email: 'luiz@email.com', telefone: '(91) 99999-1234', ativo: true },
    { id: 2, nome: 'Empresa Tech Solutions LTDA', documento: '12.345.678/0001-90', email: 'contato@tech.com', telefone: '(11) 3333-4444', ativo: true },
    { id: 3, nome: 'Maria da Silva', documento: '987.654.321-00', email: 'maria@email.com', telefone: '(21) 98888-5678', ativo: false },
])

// --- Colunas da Tabela ---
const columns = [
    { name: 'nome', label: 'Nome / Razão Social', field: 'nome', align: 'left', sortable: true },
    { name: 'documento', label: 'CPF / CNPJ', field: 'documento', align: 'left', sortable: true },
    { name: 'contato', label: 'Contato', field: 'email', align: 'left', classes: 'hidden-xs' },
    { name: 'status', label: 'Status', field: 'ativo', align: 'center', sortable: true },
    { name: 'acoes', label: 'Ações', field: 'acoes', align: 'center' }
]

// --- Computed (Filtro) ---
const filteredClientes = computed(() => {
    if (!filter.value) return clientes.value
    const term = filter.value.toLowerCase()
    return clientes.value.filter(c =>
        c.nome.toLowerCase().includes(term) ||
        c.documento.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
    )
})

// --- Métodos ---
const criarCliente = () => $q.notify({ message: 'Abrir modal de criação', color: 'primary', icon: 'info' })

const visualizarCliente = (c) => $q.notify({ message: `Visualizando: ${c.nome}`, color: 'primary', icon: 'visibility' })

const editarCliente = (c) => $q.notify({ message: `Editando: ${c.nome}`, color: 'orange', icon: 'edit' })

const confirmarExclusao = (c) => {
    clienteSelecionado.value = c
    dialogExclusao.value = true
}

const deletarCliente = () => {
    clientes.value = clientes.value.filter(c => c.id !== clienteSelecionado.value.id)
    $q.notify({ message: 'Cliente excluído com sucesso!', color: 'positive', icon: 'check' })
    clienteSelecionado.value = null
}
</script>

<style scoped>
/* Garante que o texto nas células quebre linha se necessário */
:deep(.q-td) {
    white-space: normal;
}
</style>