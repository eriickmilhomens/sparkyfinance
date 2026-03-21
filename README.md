<p align="center">
  <img src="public/pwa-192x192.png" alt="Sparky Logo" width="80" />
</p>

<h1 align="center">🐱 Sparky — Controle Financeiro Inteligente</h1>

<p align="center">
  <strong>Gerencie suas finanças pessoais e familiares com inteligência artificial, gamificação e Open Finance.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white" />
</p>

<p align="center">
  Desenvolvido com 💙 por <strong>Erick Milhomens</strong> (<em>Erick Developer</em>)<br/>
  <em>🐱 Sparky (Faísca) — inspirado no gatinho que dá nome ao projeto.</em>
</p>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Módulos Detalhados](#-módulos-detalhados)
- [Backend & Edge Functions](#-backend--edge-functions)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação](#-autenticação)
- [PWA & Instalação](#-pwa--instalação)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Deploy na Vercel](#-deploy-na-vercel)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Licença](#-licença)

---

## 🌟 Visão Geral

**Sparky** é uma aplicação web progressiva (PWA) de controle financeiro pessoal e familiar. Combina um dashboard intuitivo, assistente de IA conversacional, gamificação com sistema de pontos e competição em grupo, além de integração com Open Finance via Pluggy para sincronização automática de dados bancários.

O app foi projetado como **mobile-first** mas é totalmente responsivo, funcionando perfeitamente em smartphones, tablets e desktops.

---

## ✨ Funcionalidades

### 💰 Dashboard Principal
- **Saldo Disponível** em tempo real com toggle de visibilidade
- **Cards de resumo**: Saldo Real, A Pagar e Saldo Disponível
- **Gráfico de distribuição de gastos** (rosca/donut) por categoria
- **Simulador "Pode Gastar Hoje"** com cálculo automático baseado nos dias restantes do mês
- **Cards de cartões de crédito** com barra de progresso de utilização do limite
- **Próximas contas** a vencer
- **Dicas inteligentes** contextualizadas baseadas na situação financeira
- **Assistente WhatsApp** (em implementação)
- Alternância **modo claro/escuro** em todo o app

### 💳 Gestão de Cartões de Crédito
- Cadastro de cartões com seleção de **instituição bancária** (Nubank, Itaú, Bradesco, Inter, C6, etc.)
- Seleção de **bandeira** (Visa, Mastercard, Elo, Amex, Hipercard)
- Tipo de cartão: Crédito, Débito ou Múltiplo
- **Limite disponível**, fatura atual, data de vencimento e fechamento
- Barra de progresso visual do uso do limite
- Visualização expandível com gastos do mês e extrato individual
- Botão de **pagar fatura** (total ou parcial)

### 📊 Módulo de Despesas (4 abas)
1. **Visão Geral**: gráficos de distribuição, evolução mensal, metas e importação com IA
2. **Extrato**: histórico detalhado de transações com filtros e busca
3. **Planejamento**: orçamento mensal por categoria com comparativo planejado vs real, metas de investimento (reserva de emergência, cuidado pessoal, etc.)
4. **Cartões**: gestão completa de cartões de crédito

### 🤖 Sparky IA (Chat Inteligente)
- Assistente conversacional powered by **Google Gemini 2.5 Pro**
- **Contexto financeiro completo**: analisa saldos, cartões, metas e transações do usuário
- **Histórico de conversas** persistente com títulos automáticos gerados pela IA
- Novo chat após 12h de inatividade
- Opção de **apagar chats** individualmente ou todos de uma vez
- Adapta o estilo de conversa (direto ao ponto ou informativo) com base no feedback do usuário
- Conhece o projeto Sparky e seu criador (Erick Milhomens)

### 📥 Importação de Extrato com IA
- Cole o texto do extrato bancário e a IA categoriza automaticamente
- Tela de revisão com transações detectadas em grid editável
- Seleção individual ou em lote para importação
- Recálculo automático de saldos após importação

### 🏆 Gamificação & Ranking
- **Sistema de pontos** por bons hábitos financeiros
- **Ranking do grupo** com pódio visual (1º, 2º, 3º lugar)
- **Conquistas** com progresso e badges premium
- Frases motivacionais e de inspiração financeira
- Competição familiar baseada em desempenho financeiro

### 👥 Gestão de Grupo & Membros
- **Código de convite único** por conta para criar grupos
- Gerenciamento de membros: admins e membros regulares
- Visualização de estatísticas do grupo

### 🎁 Sistema de Prêmios
- Criação e gestão de prêmios resgatáveis com pontos
- Registro de resgates com nome do usuário e data
- Loja de prêmios por perfil

### 👤 Perfil & Multi-Perfil
- Upload de foto (galeria ou câmera)
- Edição de informações pessoais
- Criação de **perfis adicionais** com dados isolados
- Alternância rápida entre perfis
- Proteção contra exclusão do perfil original

### 📄 Documentos
- Upload e organização de documentos por categoria:
  - Comprovantes de Renda
  - Notas Fiscais
  - Contratos
  - Outros Documentos

### 🔄 Open Finance (Pluggy)
- Sincronização automática de contas bancárias
- Fallback inteligente: se a conexão for perdida, salva snapshot diário e ativa modo manual
- Banner de aviso quando operando sem sincronização

### 🔐 Autenticação
- Registro e login via **e-mail + senha** ou **telefone + senha**
- Seletor de código de país com bandeiras (padrão 🇧🇷 +55)
- Auto-confirm de e-mails (login imediato)
- **Modo Demo** oculto (7 toques no logo do gatinho)
- Logout com confirmação

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────┐
│                  Frontend (PWA)                  │
│         React + TypeScript + Tailwind            │
│              Vite + Service Worker               │
├─────────────────────────────────────────────────┤
│                  Supabase Cloud                  │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
│  │    Auth    │  │ Database │  │Edge Functions│  │
│  │ Email/Tel  │  │ Postgres │  │  Deno Runtime│  │
│  └───────────┘  └──────────┘  └──────────────┘  │
├─────────────────────────────────────────────────┤
│              Integrações Externas                │
│  ┌───────────┐  ┌──────────────────────────┐     │
│  │  Pluggy   │  │   Google Gemini 2.5 Pro  │     │
│  │(Open Fin.)│  │   (Lovable AI Gateway)   │     │
│  └───────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

---

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Estilização** | Tailwind CSS 3, shadcn/ui, CSS Variables (HSL) |
| **Estado** | React Hooks, TanStack React Query, localStorage |
| **Roteamento** | React Router DOM 6 |
| **Gráficos** | Recharts |
| **Backend** | Supabase (Auth, Database, Edge Functions) |
| **IA** | Google Gemini 2.5 Pro (via Lovable AI Gateway) |
| **Open Finance** | Pluggy API |
| **PWA** | vite-plugin-pwa, Workbox |
| **Componentes UI** | shadcn/ui (Radix UI primitives) |
| **Ícones** | Lucide React |
| **Notificações** | Sonner |

---

## 📁 Estrutura de Pastas

```
sparky/
├── public/                          # Arquivos estáticos e PWA
│   ├── pwa-192x192.png              # Ícone PWA 192px
│   ├── pwa-512x512.png              # Ícone PWA 512px
│   ├── robots.txt                   # SEO
│   └── placeholder.svg              # Placeholder genérico
│
├── src/
│   ├── components/
│   │   ├── dashboard/               # Componentes do dashboard principal
│   │   │   ├── BalanceCard.tsx       # Card de saldo disponível
│   │   │   ├── SpendingOverview.tsx  # Visão geral de gastos, simulador e cartões
│   │   │   └── SuggestionsCard.tsx   # Dicas inteligentes e WhatsApp
│   │   │
│   │   ├── expenses/                # Módulo completo de despesas
│   │   │   ├── AddExpenseModal.tsx   # Modal para adicionar despesa/receita
│   │   │   ├── CreditCardManager.tsx # Gestão completa de cartões de crédito
│   │   │   ├── DonutChart.tsx        # Gráfico de rosca de distribuição
│   │   │   ├── ExtratoTab.tsx        # Aba de extrato/histórico
│   │   │   ├── ImportModal.tsx       # Importação de extrato com IA
│   │   │   ├── PlanejamentoTab.tsx   # Aba de planejamento e metas
│   │   │   ├── TrendChart.tsx        # Gráfico de tendência/evolução
│   │   │   └── VisaoGeralTab.tsx     # Aba de visão geral
│   │   │
│   │   ├── layout/                  # Componentes de layout
│   │   │   ├── Header.tsx           # Cabeçalho com logo, saudação e tema
│   │   │   ├── ProfileSwitcher.tsx  # Menu de perfil completo
│   │   │   └── TabBar.tsx           # Barra de navegação inferior
│   │   │
│   │   ├── ui/                      # Componentes shadcn/ui (40+ componentes)
│   │   │
│   │   └── views/                   # Views principais do app
│   │       ├── ChatView.tsx         # Chat com Sparky IA
│   │       ├── DashboardView.tsx    # Dashboard principal
│   │       ├── DocsView.tsx         # Gestão de documentos
│   │       ├── ExpensesView.tsx     # Módulo de despesas (tabs)
│   │       └── TasksView.tsx        # Ranking e conquistas
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── use-mobile.tsx           # Detecção de dispositivo móvel
│   │   ├── usePluggy.ts             # Integração com Pluggy (Open Finance)
│   │   ├── useProfile.ts            # Perfil do usuário (Supabase)
│   │   └── useTheme.ts             # Alternância tema claro/escuro
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts            # Cliente Supabase (auto-gerado)
│   │       └── types.ts             # Tipos do banco de dados (auto-gerado)
│   │
│   ├── pages/
│   │   ├── Index.tsx                # Página principal (roteador de views)
│   │   ├── Login.tsx                # Tela de login
│   │   ├── NotFound.tsx             # Página 404
│   │   └── Onboarding.tsx           # Registro e onboarding
│   │
│   ├── App.tsx                      # Componente raiz com rotas
│   ├── index.css                    # Design tokens e variáveis CSS
│   └── main.tsx                     # Entry point
│
├── supabase/
│   ├── config.toml                  # Configuração Supabase
│   ├── migrations/                  # Migrações SQL do banco
│   └── functions/                   # Edge Functions (Deno)
│       ├── sparky-chat/             # IA conversacional (Gemini)
│       ├── sparky-import/           # Importação de extrato com IA
│       ├── pluggy-connect-token/    # Token de conexão Pluggy
│       └── pluggy-accounts/         # Contas bancárias Pluggy
│
├── index.html                       # HTML entry com meta tags SEO
├── vite.config.ts                   # Configuração Vite + PWA
├── tailwind.config.ts               # Configuração Tailwind + design tokens
└── package.json                     # Dependências e scripts
```

---

## 📦 Módulos Detalhados

### Dashboard (`src/components/dashboard/`)

| Componente | Descrição |
|-----------|-----------|
| `BalanceCard` | Exibe o saldo disponível com toggle de visibilidade (olho). Mostra receitas e despesas do mês. |
| `SpendingOverview` | Container principal com gráfico de distribuição de gastos (donut), simulador "Pode Gastar Hoje", cards de cartões de crédito e próximas contas. |
| `SuggestionsCard` | Dicas inteligentes contextualizadas + botão de assistente WhatsApp (em implementação). |

### Despesas (`src/components/expenses/`)

| Componente | Descrição |
|-----------|-----------|
| `AddExpenseModal` | Modal completo para adicionar despesas ou receitas. Suporta categorias, cartão de crédito, parcelamento (2x, 6x...) e lançamento em fatura. |
| `CreditCardManager` | CRUD completo de cartões com seletor de banco, bandeira, tipo e limite. |
| `ImportModal` | Importação inteligente: cole o extrato → IA categoriza → revise → importe. |
| `PlanejamentoTab` | Planejamento de orçamento por categoria + metas de investimento com barra de progresso. |
| `DonutChart` | Gráfico de rosca responsivo com Recharts para distribuição de gastos por categoria. |
| `TrendChart` | Gráfico de linha para evolução do saldo ao longo do tempo. |

### Layout (`src/components/layout/`)

| Componente | Descrição |
|-----------|-----------|
| `Header` | Logo SPARKY + saudação "Olá, {nome}" (do banco de dados) + toggle tema + avatar. |
| `ProfileSwitcher` | Menu flutuante completo: perfil, ranking, prêmios, membros, multi-perfil, logout. |
| `TabBar` | Navegação inferior com 5 abas: Home, Ranking, Sparky IA, Despesas, Docs. |

---

## ⚡ Backend & Edge Functions

### `sparky-chat` — Assistente IA
- **Runtime**: Deno (Supabase Edge Functions)
- **Modelo**: Google Gemini 2.5 Pro (via Lovable AI Gateway)
- **Funcionalidades**: Contexto financeiro completo do usuário, geração de títulos de chat, adaptação de estilo de conversa
- **Endpoint**: `POST /functions/v1/sparky-chat`

### `sparky-import` — Importação com IA
- **Modelo**: Google Gemini 2.5 Flash
- **Funcionalidades**: Extração estruturada de transações de texto bruto, categorização automática
- **Endpoint**: `POST /functions/v1/sparky-import`

### `pluggy-connect-token` — Open Finance
- **API**: Pluggy
- **Funcionalidade**: Gera token de conexão para vincular contas bancárias
- **Endpoint**: `POST /functions/v1/pluggy-connect-token`

### `pluggy-accounts` — Contas Bancárias
- **API**: Pluggy
- **Funcionalidade**: Busca contas e saldos do usuário conectado
- **Endpoint**: `POST /functions/v1/pluggy-accounts`

---

## 🗄 Banco de Dados

### Tabela `profiles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | Chave primária |
| `user_id` | UUID | Referência ao auth.users |
| `name` | TEXT | Nome do usuário |
| `email` | TEXT | E-mail (nullable) |
| `phone` | TEXT | Telefone (nullable) |
| `avatar_url` | TEXT | URL da foto de perfil |
| `invite_code` | TEXT | Código de convite único (8 chars) |
| `group_code` | TEXT | Código do grupo (nullable) |
| `points` | INTEGER | Pontos de gamificação |
| `role` | TEXT | Papel: admin ou member |
| `created_at` | TIMESTAMPTZ | Data de criação |

### RLS (Row-Level Security)
- **INSERT**: Usuários só podem inserir seu próprio perfil
- **SELECT**: Usuários veem seu perfil + perfis do mesmo grupo
- **UPDATE**: Usuários só podem atualizar seu próprio perfil

### Trigger `handle_new_user()`
Executado automaticamente ao criar conta. Gera um perfil com `invite_code` único e `group_code` igual ao próprio código.

---

## 🔐 Autenticação

| Método | Descrição |
|--------|-----------|
| **E-mail + Senha** | Registro e login com auto-confirm |
| **Telefone + Senha** | Com seletor de código de país (+55 🇧🇷 padrão) |
| **Modo Demo** | 7 toques no logo do gatinho na tela de login |

### Fluxo de Onboarding
1. Registro (e-mail ou telefone + senha)
2. Escolha: Criar Novo Grupo ou Entrar em Grupo (código de convite)
3. Redirecionamento para o dashboard

---

## 📱 PWA & Instalação

O Sparky é uma **Progressive Web App** instalável:

- ✅ Service Worker com cache offline (Workbox)
- ✅ Manifest com ícones 192px e 512px
- ✅ Orientação portrait
- ✅ Display standalone (sem barra do navegador)
- ✅ Theme color `#3b82f6`

Para instalar: acesse o app no navegador → "Adicionar à tela inicial".

---

## 🚀 Como Rodar Localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sparky.git
cd sparky

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY

# Rode o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:8080`.

---

## 🌐 Deploy na Vercel

1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Deploy! 🚀

> **Nota**: As Edge Functions rodam no Supabase Cloud, não na Vercel. O frontend se conecta a elas via API.

---

## 🔑 Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon/pública do Supabase |
| `PLUGGY_CLIENT_ID` | Client ID da API Pluggy (secret — Edge Functions) |
| `PLUGGY_CLIENT_SECRET` | Client Secret da API Pluggy (secret — Edge Functions) |
| `LOVABLE_API_KEY` | Chave para Lovable AI Gateway (secret — Edge Functions) |

> As variáveis `PLUGGY_*` e `LOVABLE_API_KEY` são configuradas como secrets nas Edge Functions, não no frontend.

---

## 📄 Licença

Este projeto é de uso privado. Todos os direitos reservados a **Erick Milhomens**.

---

<p align="center">
  <strong>🐱 Sparky</strong> — Faísca de controle financeiro.<br/>
  <em>Feito com 💙 por Erick Developer</em>
</p>
