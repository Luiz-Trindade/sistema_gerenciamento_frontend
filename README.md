<div align="center">

# Sistema de Gerenciamento Corporativo (Frontend)

### Trabalho Acadêmico — Big Data Python

**Faculdade FACI Wyden**

</div>

<div align="center">

[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Quasar](https://img.shields.io/badge/Quasar-2.x-1976D2?logo=quasar&logoColor=white)](https://quasar.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vue Query](https://img.shields.io/badge/Vue%20Query-5.x-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query/latest/docs/framework/vue/overview)
[![Pinia](https://img.shields.io/badge/Pinia-State%20Management-yellowgreen?logo=vue.js&logoColor=white)](https://pinia.vuejs.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0.html)

</div>

> Interface web responsiva (SPA) desenvolvida para consumir a API REST do sistema de gerenciamento, oferecendo uma experiência **mobile-first**, com suporte nativo a **Modo Escuro**, dashboards interativos com Chart.js e um **PDV (Ponto de Venda)** com geração de comprovante em formato de cupom térmico.

---

## 👥 Participantes

- **Caio Pantoja Correa** — 202302416071
- **Jessica Freire Carvalho** — 202404170527
- **Lohhana Lima Pinheiro** — 202508864207
- **Luiz Gabriel Magalhães Trindade** — 202302954812
- **Paulo Henrique Magno Moura** — 202302416081

**Orientadora:** Prof.ª Me. Larissa de Paula Serrão Garcia

---

## 🎓 Sobre o Projeto (Frontend)

Este repositório contém a aplicação **Single Page Application (SPA)** que compõe a camada de apresentação do Sistema de Gerenciamento Corporativo. Desenvolvido com **Vue.js 3** e **Quasar Framework**, o frontend prioriza a experiência do usuário (UX) em dispositivos móveis sem perder funcionalidade em desktops.

A aplicação se comunica com o backend Django via **API REST**, gerenciando autenticação JWT, cache de dados, estado global e renderização de gráficos. O gerenciamento de estado do servidor é feito com **TanStack Vue Query**, que provê cache automático, revalidação em background e sincronização de dados entre telas sem código imperativo.

## 📑 Sumário

- [Arquitetura do Frontend](#-arquitetura-do-frontend)
- [Módulos da Interface](#-módulos-da-interface)
- [Destaques de Implementação](#-destaques-de-implementação)
- [Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [Como Executar](#-como-executar-o-frontend-localmente)
- [Integração com o Backend](#-integração-com-o-backend)
- [Licença](#-licença)

---

## 🏛️ Arquitetura do Frontend

O projeto segue as melhores práticas do ecossistema Vue.js, utilizando a **Composition API** (`<script setup>`) e uma estrutura de pastas organizada pelo Quasar CLI:

- **`src/layouts/`**: Define o esqueleto principal da aplicação (cabeçalho superior, barra de navegação inferior estilo mobile, menu lateral).
- **`src/pages/`**: Contém as views principais do sistema (Dashboard, Vendas, Estoque, Clientes, Configurações).
- **`src/components/`**: Componentes de UI reutilizáveis e desacoplados.
- **`src/router/`**: Configuração das rotas e guardas de navegação (Vue Router).
- **`src/boot/`**: Inicialização de plugins (Axios, Vue Query, etc.).
- **`src/stores/`**: Gerenciamento de estado global da aplicação (Pinia) — usado para autenticação e preferências de UI.
- **`src/css/`**: Variáveis CSS customizadas e configurações de temas (Claro/Escuro).

### Gerenciamento de Estado em Duas Camadas

| Camada                   | Ferramenta         | Responsabilidade                                                                            |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------- |
| **Estado do Servidor**   | TanStack Vue Query | Cache de dados da API, revalidação, sincronização entre páginas, `isLoading`/`isPending`    |
| **Estado Global do App** | Pinia              | Autenticação (usuário logado, tokens), preferências de UI (tema claro/escuro), notificações |

Essa separação evita o anti-padrão de replicar dados do servidor dentro de stores — o Vue Query é a única fonte de verdade para dados remotos.

---

## 📱 Módulos da Interface

- **Dashboard (`/`)**: Visão geral com cards de KPIs (Vendas, A Receber, Clientes, Estoque) e gráficos interativos (Linha e Rosca) utilizando Chart.js.

- **Vendas (`/vendas`)**: Hub de navegação para gestão de **Pedidos de Venda** e **Contas a Receber**.
    - **Pedidos (`/vendas/pedidos`)**: Tabela responsiva com CRUD completo. Criação de pedidos com adição de itens, cálculo automático de subtotais e total. Ação de **Comprovante de Venda** que abre um dialog maximized renderizando um cupom em estilo **papel térmico** (ver [Destaques](#-destaques-de-implementação)).

- **Estoque (`/estoque`)**: Hub de navegação para cadastro de **Produtos** e registro de **Movimentações**.
    - **Produtos (`/estoque/produtos`)**: Listagem com busca em tempo real, badges de saldo (positivo/negativo) e status (ativo/inativo). Ações de editar, excluir e movimentar.
    - **Movimentações (`/estoque/movimentacoes`)**: Registro de entradas e saídas de estoque, com filtros por tipo, produto e busca textual. Cada movimentação impacta diretamente o saldo do produto.

- **Clientes (`/clientes`)**: Tabela responsiva com listagem, filtragem em tempo real, paginação e ações de CRUD (Criar, Visualizar, Editar, Excluir).

- **Configurações (`/config`)**: Central de preferências do usuário, incluindo o toggle de **Modo Escuro/Claro** persistente e opção de logout.

---

## ✨ Destaques de Implementação

### 🧾 Comprovante de Venda (Cupom Térmico)

Ao clicar em **"Ver itens do pedido"** na listagem, um dialog maximized renderiza um comprovante com aparência de **cupom fiscal de impressora térmica**:

- **Papel off-white** (`#fdfbf3`) com cantos serrilhados (efeito de papel picotado via gradientes CSS).
- **Fonte monoespaçada** (`Courier New`) em todo o papel.
- **Separadores literais** (`=====` e `-----`) em vez de bordas — visual realista.
- **Cabeçalho** com "COMPROVANTE DE VENDA" + "NÃO É DOCUMENTO FISCAL".
- **Resolução de itens**: como a API de pedidos devolve apenas IDs de movimentações (`movimentacoes: [14]`), o frontend cruza com o cache de `/movimentacoes/` (mesma `queryKey`, zero fetch duplicado) e normaliza os campos.
- **Botão de impressão** que abre uma janela dedicada com CSS `@media print` otimizado.
- **100% responsivo**: no desktop aparece como papel centralizado sobre fundo cinza; no mobile ocupa a tela inteira sem sombras.

### 📊 Cache Compartilhado com Vue Query

Uso intensivo de `queryKey` consistente entre páginas (ex.: `['produtos']`, `['movimentacoes']`) permite que dados sejam reaproveitados entre telas sem novo fetch. Ao criar/editar/excluir um pedido, `invalidateQueries` revalida automaticamente as queries afetadas — a UI se atualiza em background sem código imperativo.

### 📱 Mobile-First de Verdade

- Tabelas responsivas com scroll horizontal nativo do Quasar (sem `min-width` forçado).
- Dialogs maximized com `max-width` + `margin: auto` em desktop, `100vw/100vh` em mobile.
- Botões de ação (`q-btn`) com `full-width` em telas pequenas via `$q.screen.lt.sm`.
- Breadcrumbs, headers e formulários adaptados para toque e leitura em telas estreitas.

### 🎨 Modo Escuro Persistente

Preferência de tema gerenciada via Pinia + `LocalStorage`, com detecção automática da preferência do sistema operacional no primeiro acesso.

---

## 🛠️ Tecnologias Utilizadas

- **Framework Principal:** Vue.js 3 (Composition API + `<script setup>`)
- **UI Framework:** Quasar Framework (v2.x)
- **Build Tool:** Vite (via Quasar CLI)
- **Roteamento:** Vue Router
- **Estado do Servidor:** TanStack Vue Query (`@tanstack/vue-query`)
- **Estado Global:** Pinia
- **Visualização de Dados:** Chart.js + `vue-chartjs`
- **Requisições HTTP:** Axios
- **Gerenciador de Pacotes:** pnpm (recomendado), npm ou yarn

---

## 🚀 Como Executar o Frontend Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada, ex: 20.x ou superior)
- [pnpm](https://pnpm.io/installation) (ou npm/yarn)
- O **Backend Django** rodando (para que a API esteja disponível)

### Passos

1. **Clone o repositório do frontend:**

    ```bash
    git clone <URL_DO_SEU_REPOSITORIO_FRONTEND>
    cd sistema-gerenciamento-frontend
    ```
