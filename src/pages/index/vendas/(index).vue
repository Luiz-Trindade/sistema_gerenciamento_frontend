<template>
    <q-page>
        <div class="q-pa-md">

            <!-- Breadcrumbs (Navegação estrutural) -->
            <q-breadcrumbs active-color="primary" separator-color="grey-4" class="q-mb-md">
                <q-breadcrumbs-el label="Início" icon="home" to="/" />
                <q-breadcrumbs-el label="Vendas" icon="point_of_sale" />
            </q-breadcrumbs>

            <!-- Cabeçalho -->
            <div class="row items-center q-mb-lg">
                <q-icon name="point_of_sale" color="primary" size="32px" class="q-mr-sm" />
                <div>
                    <div class="text-h6 text-weight-bold">Vendas</div>
                    <div class="text-caption text-grey-7">Escolha o módulo que deseja gerenciar</div>
                </div>
            </div>

            <!-- Grid de Cards de Navegação -->
            <div class="row q-col-gutter-md">
                <!-- Card: Ponto de Venda (PDV) -->
                <div class="col-12 col-sm-6 col-md-4">
                    <q-card class="nav-card cursor-pointer" :class="{ 'nav-card--active': activeCard === 'pdv' }"
                        @click="navigateTo('pdv')" @mousedown="activeCard = 'pdv'" @mouseup="activeCard = null"
                        @mouseleave="activeCard = null">
                        <q-card-section class="text-center q-pa-lg">
                            <q-icon name="storefront" color="purple-7" size="64px" class="q-mb-md" />
                            <div class="text-h6 text-weight-bold q-mb-xs">
                                Ponto de Venda (PDV)
                            </div>
                            <div class="text-caption text-grey-7">
                                Emissão de vendas rápidas e frente de caixa
                            </div>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <div class="row items-center justify-center text-purple-7">
                                <span class="text-caption text-weight-medium">Acessar</span>
                                <q-icon name="arrow_forward_ios" size="12px" class="q-ml-xs" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <!-- Card: Pedidos de Venda -->
                <div class="col-12 col-sm-6 col-md-4">
                    <q-card class="nav-card cursor-pointer" :class="{ 'nav-card--active': activeCard === 'pedidos' }"
                        @click="navigateTo('pedidos')" @mousedown="activeCard = 'pedidos'" @mouseup="activeCard = null"
                        @mouseleave="activeCard = null">
                        <q-card-section class="text-center q-pa-lg">
                            <q-icon name="receipt_long" color="primary" size="64px" class="q-mb-md" />
                            <div class="text-h6 text-weight-bold q-mb-xs">
                                Pedidos de Venda
                            </div>
                            <div class="text-caption text-grey-7">
                                Gerenciar vendas, itens e status dos pedidos
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

                <!-- Card: Contas a Receber -->
                <div class="col-12 col-sm-6 col-md-4">
                    <q-card class="nav-card cursor-pointer" :class="{ 'nav-card--active': activeCard === 'contas' }"
                        @click="navigateTo('contas')" @mousedown="activeCard = 'contas'" @mouseup="activeCard = null"
                        @mouseleave="activeCard = null">
                        <q-card-section class="text-center q-pa-lg">
                            <q-icon name="account_balance_wallet" color="green-7" size="64px" class="q-mb-md" />
                            <div class="text-h6 text-weight-bold q-mb-xs">
                                Contas a Receber
                            </div>
                            <div class="text-caption text-grey-7">
                                Parcelas, vencimentos e registros de pagamento
                            </div>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <div class="row items-center justify-center text-green-7">
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
    router.push(`/vendas/${modulo}`)
}
</script>

<style scoped>
.nav-card {
    transition: all 0.2s ease;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.06);
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