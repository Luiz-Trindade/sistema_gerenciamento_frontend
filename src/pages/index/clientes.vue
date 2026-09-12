<template>
    <q-page>
        <!-- Cabeçalho -->
        <div class="q-pa-md shadow-1 rounded-borders q-mb-md">
            <div class="row items-center justify-between q-mb-md">
                <div class="row items-center">
                    <q-icon name="people" color="primary" size="32px" class="q-mr-sm" />
                    <div>
                        <div class="text-h6 text-weight-bold">Clientes</div>
                        <div class="text-caption text-grey-7">
                            {{ clientes.length }} registros no total
                        </div>
                    </div>
                </div>

                <q-btn color="primary" icon="add" label="Novo Cliente" unelevated @click="criarCliente"
                    class="q-mt-sm q-mb-sm q-sm-mt-none q-sm-mb-none" />
            </div>

            <q-input v-model="filter" dense outlined rounded placeholder="Buscar por nome, CPF ou CNPJ...">
                <template v-slot:prepend>
                    <q-icon name="search" color="grey-6" />
                </template>
                <template v-slot:append>
                    <q-icon v-if="filter" name="clear" class="cursor-pointer" @click="filter = ''" />
                </template>
            </q-input>
        </div>

        <!-- Tabela -->
        <div class="q-pa-md">
            <q-table :rows="clientes" :columns="columns" row-key="id" :filter="filter" dense flat separator="horizontal"
                class="rounded-borders striped-table" :rows-per-page-options="[10, 20, 50]">

                <template v-slot:body-cell-contato="props">
                    <q-td :props="props">
                        <div>{{ props.row.email }}</div>
                        <!-- Removido text-grey-7 forçado, usando apenas text-caption para herdar a cor reativa do tema -->
                        <div class="text-caption">{{ props.row.telefone }}</div>
                    </q-td>
                </template>

                <template v-slot:body-cell-status="props">
                    <q-td :props="props">
                        <q-badge :color="props.value ? 'green' : 'grey'" :label="props.value ? 'Ativo' : 'Inativo'" />
                    </q-td>
                </template>

                <template v-slot:body-cell-acoes="props">
                    <q-td :props="props" class="text-center">
                        <q-btn flat dense round color="primary" icon="visibility" @click="visualizarCliente(props.row)">
                            <q-tooltip>Visualizar</q-tooltip>
                        </q-btn>
                        <q-btn flat dense round color="orange" icon="edit" @click="editarCliente(props.row)">
                            <q-tooltip>Editar</q-tooltip>
                        </q-btn>
                        <q-btn flat dense round color="negative" icon="delete" @click="confirmarExclusao(props.row)">
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
        </div>

        <!-- Dialog -->
        <q-dialog v-model="dialogExclusao">
            <q-card style="min-width: 300px">
                <q-card-section class="row items-center">
                    <q-avatar icon="warning" color="negative" text-color="white" />
                    <span class="q-ml-sm text-weight-bold">Excluir Cliente?</span>
                </q-card-section>
                <q-card-section class="q-pt-none">
                    Tem certeza que deseja excluir <strong>{{ clienteSelecionado?.nome }}</strong>?
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
                    <q-btn flat label="Excluir" color="negative" @click="deletarCliente" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { ref } from 'vue'
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

const columns = [
    { name: 'nome', label: 'Nome / Razão Social', field: 'nome', align: 'left', sortable: true },
    { name: 'documento', label: 'CPF / CNPJ', field: 'documento', align: 'left', sortable: true },
    { name: 'contato', label: 'Contato', field: 'email', align: 'left', classes: 'hidden-xs' },
    { name: 'status', label: 'Status', field: 'ativo', align: 'center', sortable: true },
    { name: 'acoes', label: 'Ações', align: 'center' }
]

const criarCliente = () => $q.notify({ message: 'Abrir modal de criação', color: 'primary', icon: 'info' })
const visualizarCliente = (c) => $q.notify({ message: `Visualizando: ${c.nome}`, color: 'primary', icon: 'visibility' })
const editarCliente = (c) => $q.notify({ message: `Editando: ${c.nome}`, color: 'orange', icon: 'edit' })
const confirmarExclusao = (c) => { clienteSelecionado.value = c; dialogExclusao.value = true }
const deletarCliente = () => {
    clientes.value = clientes.value.filter(c => c.id !== clienteSelecionado.value.id)
    $q.notify({ message: 'Excluído com sucesso!', color: 'positive', icon: 'check' })
    clienteSelecionado.value = null
}
</script>

<style scoped>
:deep(.q-td) {
    white-space: normal;
}

/* CSS ROBUSTO PARA LISTRAS: Funciona instantaneamente na troca de tema */
.striped-table :deep(tbody tr:nth-child(even)) {
    background-color: rgba(0, 0, 0, 0.04) !important;
}

.body--dark .striped-table :deep(tbody tr:nth-child(even)) {
    background-color: rgba(255, 255, 255, 0.07) !important;
}
</style>