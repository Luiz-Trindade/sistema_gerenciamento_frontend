<div align="center">

# Sistema de Gerenciamento Corporativo (Frontend)

### Trabalho Acadêmico — Big Data Python

**Faculdade FACI Wyden**

</div>

<div align="center">

[![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Quasar](https://img.shields.io/badge/Quasar-2.x-1976D2?logo=quasar&logoColor=white)](https://quasar.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-State%20Management-yellowgreen?logo=vue.js&logoColor=white)](https://pinia.vuejs.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0.html)

</div>

> Interface web responsiva (SPA) desenvolvida para consumir a API REST do sistema de gerenciamento, oferecendo uma experiência mobile-first, com suporte nativo a Modo Escuro e visualização de dados através de dashboards interativos.

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

Este repositório contém a aplicação Single Page Application (SPA) que compõe a camada de apresentação do Sistema de Gerenciamento Corporativo. Desenvolvido com **Vue.js 3** e **Quasar Framework**, o frontend prioriza a experiência do usuário (UX) em dispositivos móveis, sem perder a funcionalidade em desktops. Ele se comunica com o backend Django via API REST, gerenciando autenticação, estado da aplicação e renderização de gráficos.

## 📑 Sumário

- [Arquitetura do Frontend](#-arquitetura-do-frontend)
- [Módulos da Interface](#-módulos-da-interface)
- [Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [Como Executar](#-como-executar-o-frontend-localmente)
- [Integração com o Backend](#-integração-com-o-backend)
- [Licença](#-licença)

---

## 🏛️ Arquitetura do Frontend

O projeto segue as melhores práticas do ecossistema Vue.js, utilizando a Composition API (`<script setup>`) e uma estrutura de pastas organizada pelo Quasar CLI:

- **`src/layouts/`**: Define o esqueleto principal da aplicação (cabeçalho superior e barra de navegação inferior estilo mobile).
- **`src/pages/`**: Contém as views principais do sistema (Dashboard, Vendas, Estoque, Clientes, Configurações).
- **`src/components/`**: Componentes de UI reutilizáveis e desacoplados.
- **`src/router/`**: Configuração das rotas e guardas de navegação (Vue Router).
- **`src/stores/`**: Gerenciamento de estado global da aplicação (Pinia).
- **`src/css/`**: Variáveis CSS customizadas e configurações de temas (Claro/Escuro).

---

## 📱 Módulos da Interface

- **Dashboard (`/`)**: Visão geral com cards de KPIs (Vendas, A Receber, Clientes, Estoque) e gráficos interativos (Linha e Rosca) utilizando Chart.js.
- **Vendas (`/vendas`)**: Hub de navegação para gestão de Pedidos de Venda e Contas a Receber.
- **Estoque (`/estoque`)**: Hub de navegação para cadastro de Produtos e registro de Movimentações.
- **Clientes (`/clientes`)**: Tabela responsiva com listagem, filtragem em tempo real, paginação e ações de CRUD (Criar, Visualizar, Editar, Excluir).
- **Configurações (`/config`)**: Central de preferências do usuário, incluindo o toggle de **Modo Escuro/Claro** persistente e opção de logout.

---

## 🛠️ Tecnologias Utilizadas

- **Framework Principal:** Vue.js 3 (Composition API)
- **UI Framework:** Quasar Framework (v2.x)
- **Build Tool:** Vite (via Quasar CLI)
- **Roteamento:** Vue Router
- **Gerenciamento de Estado:** Pinia
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

2. **Instale as dependências:**

   ```bash
   pnpm install
   # ou: npm install / yarn install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto e defina a URL da sua API Django:

   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Inicie o servidor de desenvolvimento:**

   ```bash
   quasar dev
   ```

   _O aplicativo estará disponível em `http://localhost:9000` (ou outra porta indicada no terminal)._

5. **Build para produção:**
   Para gerar os arquivos estáticos otimizados para deploy:
   ```bash
   quasar build
   ```
   _(Os arquivos gerados estarão na pasta `dist/spa/`)_

---

## 🔗 Integração com o Backend

Este frontend foi projetado para trabalhar em conjunto com o repositório `sistema_gerenciamento` (Backend Django).

- Certifique-se de que o backend esteja configurado com `django-cors-headers` permitindo a origem do seu frontend (ex: `http://localhost:9000`).
- A autenticação é gerenciada via tokens JWT (SimpleJWT), armazenados de forma segura no frontend.

---

## 📄 Licença

Este projeto está licenciado sob a **GNU Affero General Public License v3.0 (AGPL-3.0)**.

<div align="center">

[![Licença GNU AGPL v3](https://www.gnu.org/graphics/agplv3-with-text-162x68.png)](https://www.gnu.org/licenses/agpl-3.0.html)

Consulte o arquivo [`LICENSE`](LICENSE) para mais detalhes.

</div>
