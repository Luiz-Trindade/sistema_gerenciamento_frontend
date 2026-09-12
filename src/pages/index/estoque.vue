<template>
    <q-page>
        <div class="q-pa-md">
            <!-- Cabeçalho -->
            <div class="row items-center q-mb-lg">
                <q-icon name="inventory_2" color="primary" size="32px" class="q-mr-sm" />
                <div>
                    <div class="text-h6 text-weight-bold">Estoque</div>
                    <div class="text-caption text-grey-7">Escolha o módulo que deseja gerenciar</div>
                </div>
            </div>

            <!-- Grid de Cards de Navegação -->
            <div class="row q-col-gutter-md">
                <!-- Card: Produtos -->
                <div class="col-12 col-sm-6">
                    <q-card class="nav-card cursor-pointer" :class="{ 'nav-card--active': activeCard === 'produtos' }"
                        @click="navigateTo('produtos')" @mousedown="activeCard = 'produtos'"
                        @mouseup="activeCard = null" @mouseleave="activeCard = null">
                        <q-card-section class="text-center q-pa-lg">
                            <q-icon name="category" color="primary" size="64px" class="q-mb-md" />
                            <div class="text-h6 text-weight-bold q-mb-xs">
                                Produtos
                            </div>
                            <div class="text-caption text-grey-7">
                                Cadastrar, editar e visualizar o catálogo de itens
                            </div>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <div class="row items-center justify-center text-primary">
                                <span class="text-caption text-weight-medium">Acessar</span>
                                <q-icon name="arrow_forward_ios" size="12px" class="q-ml-xs" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <!-- Card: Movimentações -->
                <div class="col-12 col-sm-6">
                    <q-card class="nav-card cursor-pointer"
                        :class="{ 'nav-card--active': activeCard === 'movimentacoes' }"
                        @click="navigateTo('movimentacoes')" @mousedown="activeCard = 'movimentacoes'"
                        @mouseup="activeCard = null" @mouseleave="activeCard = null">
                        <q-card-section class="text-center q-pa-lg">
                            <q-icon name="swap_horiz" color="orange" size="64px" class="q-mb-md" />
                            <div class="text-h6 text-weight-bold q-mb-xs">
                                Movimentações
                            </div>
                            <div class="text-caption text-grey-7">
                                Registrar entradas, saídas e ajustar saldos
                            </div>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <div class="row items-center justify-center text-orange">
                                <span class="text-caption text-weight-medium">Acessar</span>
                                <q-icon name="arrow_forward_ios" size="12px" class="q-ml-xs" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeCard = ref(null)

const navigateTo = (modulo) => {
    router.push(`/estoque/${modulo}`)
}
</script>

<style scoped>
.nav-card {
    transition: all 0.2s ease;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.nav-card--active {
    transform: scale(0.97);
    opacity: 0.85;
}

.cursor-pointer {
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}
</style>