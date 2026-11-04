<template>
    <q-page class="q-pa-xs q-pa-sm-md flex flex-center">
        <!-- Card com altura delimitada (calculada contra o viewport) -->
        <q-card flat bordered class="column no-wrap overflow-hidden full-width"
            :style="{ height: $q.screen.lt.md ? 'calc(100vh - 135px)' : 'calc(100vh - 100px)' }">
            <!-- Área de Mensagens (Scroll restrito à altura do card) -->
            <q-card-section class="col scroll q-pa-xs q-pa-sm-md" ref="messagesContainer">
                <div v-for="(msg, index) in messages" :key="index" class="q-mb-xs"
                    :class="msg.sent ? 'q-pl-md q-pl-sm-xl' : 'q-pr-md q-pr-sm-xl'">
                    <q-chat-message :name="msg.sent ? 'Você' : 'Assistente IA'" :stamp="msg.stamp" :sent="msg.sent"
                        :bg-color="msg.sent ? 'primary' : ($q.dark.isActive ? 'grey-9' : 'grey-3')"
                        :text-color="msg.sent ? 'white' : ($q.dark.isActive ? 'white' : 'dark')">
                        <template #avatar>
                            <q-avatar size="28px" class="q-mx-xs">
                                <q-icon v-if="!msg.sent" name="auto_awesome" color="amber-8" size="18px" />
                                <q-icon v-else name="person" color="primary" size="18px" />
                            </q-avatar>
                        </template>
                        <div class="text-body2" v-html="msg.text"></div>
                    </q-chat-message>
                </div>

                <!-- Indicador de Carregamento -->
                <div v-if="isTyping" class="row items-center q-ml-md q-my-xs text-grey-6">
                    <q-spinner-dots size="1.8em" color="primary" class="q-mr-xs" />
                    <span class="text-caption">Analisando dados do ERP...</span>
                </div>
            </q-card-section>

            <q-separator />

            <!-- Entrada Fixa (Garantida por col-auto na base do flex box) -->
            <q-card-section class="col-auto q-pa-xs q-pa-sm-sm">
                <!-- Prompts Sugeridos (Scroll Horizontal) -->
                <div class="row no-wrap scroll q-gutter-xs q-mb-xs q-pb-xs">
                    <q-btn v-for="(prompt, idx) in quickPrompts" :key="idx" outline dense size="sm" color="primary"
                        :label="prompt" no-caps class="no-shrink" @click="sendQuickPrompt(prompt)"
                        :disable="isTyping" />
                </div>

                <!-- Campo de Digitação -->
                <div class="row items-center q-gutter-xs">
                    <q-input v-model="newMessage" dense outlined class="col"
                        placeholder="Pergunte sobre vendas, estoque ou parcelas..." @keyup.enter="sendMessage"
                        :disable="isTyping">
                        <template #prepend>
                            <q-icon name="auto_awesome" color="primary" size="18px" />
                        </template>
                    </q-input>
                    <q-btn color="primary" icon="send" unelevated :disable="!newMessage.trim() || isTyping"
                        @click="sendMessage" />
                </div>
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { api } from '@/boot/axios'

const messagesContainer = ref(null)
const newMessage = ref('')
const isTyping = ref(false)

const getCurrentTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const messages = ref([
    {
        sent: false,
        text: 'Olá! Sou o seu assistente de relatórios inteligente. Como posso ajudar com a gestão de vendas e estoque hoje?',
        stamp: getCurrentTime()
    }
])

const quickPrompts = [
    'Resumo de vendas do mês',
    'Produtos com estoque crítico',
    'Previsão de recebimentos'
]

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value?.$el) {
            messagesContainer.value.$el.scrollTop = messagesContainer.value.$el.scrollHeight
        }
    })
}

const sendMessage = async () => {
    const text = newMessage.value.trim()
    if (!text || isTyping.value) return

    messages.value.push({ sent: true, text, stamp: getCurrentTime() })
    newMessage.value = ''
    isTyping.value = true
    scrollToBottom()

    try {
        const response = await api.post('/relatorios-ia/', { mensagem: text })
        messages.value.push({
            sent: false,
            text: response.data.resposta || 'Não foi possível obter uma resposta válida.',
            stamp: getCurrentTime()
        })
    } catch {
        messages.value.push({
            sent: false,
            text: 'Desculpe, ocorreu um erro ao consultar o assistente de relatórios. Tente novamente mais tarde.',
            stamp: getCurrentTime()
        })
    } finally {
        isTyping.value = false
        scrollToBottom()
    }
}

const sendQuickPrompt = (promptText) => {
    newMessage.value = promptText
    sendMessage()
}
</script>