<div align="center">

# ⚡ HELLCORE SHOWCASE
### *Engenharia de Missão Crítica para Ecossistemas Transacionais e Atendimento em Alta Escala*

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
[![Storage Engine](https://img.shields.io/badge/Storage-SQLite_WAL_(better--sqlite3)-003B57?logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![Security Standard](https://img.shields.io/badge/Security-Fail--Closed_&_Timing--Safe-ff2d40)](./security/README.md)
[![Architecture Pattern](https://img.shields.io/badge/Architecture-2--Layer_Decoupled-00ff88)](./patterns/slash-command-2-layer.md)

<br/>

> **"Não publicamos o código-fonte integral do sistema — ele é proprietário.**  
> **Mas publicamos com orgulho os PRINCÍPIOS e PADRÕES que governam cada linha de engenharia dele."**

</div>

---

## 🧭 Visão Geral do Sistema

A **Hellcore** é uma infraestrutura de software de alta performance projetada para operar sistemas transacionais, controle financeiro, mediação de trocas (Middleman) e atendimento de clientes em tempo real no Discord e na Web.

Diferente de bots de comunidade amadores — construídos com scripts monolíticos e persistência frágil em memória —, a Hellcore adota padrões da engenharia de missão crítica: **armazenamento ACID em modo Write-Ahead Logging (WAL)**, **cálculos financeiros imutáveis em centavos inteiros**, **arquitetura de comandos desacoplada em 2 camadas** e **defesa em profundidade fail-closed**.

Este repositório público serve como uma **vitrine conceitual e arquitetural** para que clientes, desenvolvedores e parceiros possam auditar nossos padrões de confiabilidade sem expor segredos industriais.

---

## 📊 Métricas Arquiteturais de Escala

<div align="center">

| Indicador | Padrão da Indústria / Bots Comuns | Arquitetura Hellcore |
| :--- | :---: | :---: |
| **Latência de Interação (p95)** | ~250ms - 800ms | **< 45ms** *(Defer imediato + Adapter leve)* |
| **Latência de Leitura/Escrita de Dados** | 10ms - 35ms *(Bancos remotos na nuvem)* | **< 0.1ms** *(SQLite síncrono local via WAL)* |
| **Precisão em Cálculos Financeiros** | Risco de imprecisão Float IEEE 754 | **100% Exata** *(Aritmética estrita em Integer Cents)* |
| **Sobrevivência a Restarts Inesperados** | Perda de tickets/carrinhos em memória | **Zero Perda de Estado** *(Zero Memory State)* |
| **Segurança contra Injeções em Web Views** | Variável ou inexistente | **100% Sanitizado** *(Higienização universal Anti-XSS)* |
| **Tolerância a Erros de Permissão** | *Fail-Open* perigoso | **Fail-Closed Estrito** *(Na dúvida, a porta fecha)* |

</div>

---

## 🧱 Módulos do Ecossistema

```
hellcore-showcase/
├── 🏛️ ARCHITECTURE.md          ← Topologia, fluxos de concorrência e zero-state
├── 🛠️ TECH_STACK.md            ← Racional das decisões e trade-offs técnicos
├── 📐 patterns/                ← Padrões canônicos de engenharia
│   ├── README.md               ← Guia dos padrões
│   ├── slash-command-2-layer.md← Guia do padrão de Slash Command em 2 camadas
│   └── slash-command-example.js← Código autocontido testável via Node.js
└── 🔒 security/                ← Seção de Segurança por Princípio
    ├── README.md               ← Princípios, analogias e compromissos executivos
    ├── escape-html.js          ← Snippet 1 (Anti-XSS universal)
    ├── safe-compare.js         ← Snippet 2 (Comparação criptográfica timing-safe)
    └── fail-closed.js          ← Snippet 3 (Gate de segurança fail-closed com DI)
```

### 1. 🎫 Motor Transacional de Atendimento & Tickets
* Atendimento automatizado categorizado com isolamento por canal.
* Logs estruturados vinculando cada operação à autoridade responsável e data/hora UTC.
* Fechamento com geração automatizada de transcripts web estáticos.

### 2. 🤝 Sistema de Mediação Segura (Middleman Engine)
* Fluxo em etapas blindadas para mediação de itens e negociações de alto valor.
* Travamento atômico de estados para impedir que ambas as partes confirmem simultaneamente sem validação prévia.
* Trilha de auditoria integral com link de transcript inviolável para resolução de disputas.

### 3. 📜 Pipeline de Transcripts Web Sanitizados
* Converte chats do Discord em páginas web leves, com tema visual Crimson Forge e preservação de anexos.
* Sanitização obrigatória de nomes de usuário e mensagens via [`escapeHtml`](./security/escape-html.js) antes de qualquer renderização.
* Autenticação via tokens efêmeros de acesso e visualização em modo somente-leitura.

### 4. ⚡ Ledger Transacional Idempotente
* Abertura e reserva de itens com chave única de idempotência (`${id}_${hash}`).
* Leases atômicos no banco de dados para anular duplicações causadas por múltiplos cliques ou webhooks repetidos.
* Operações matemáticas 100% protegidas contra floating-point bugs.

---

## 🗺️ Mapa de Documentação Técnica

Mergulhe nos documentos técnicos que detalham a engenharia por trás do sistema:

1. [🏛️ **Arquitetura do Sistema (`ARCHITECTURE.md`)**](./ARCHITECTURE.md)  
   *Diagramas Mermaid de alto nível, fluxo de transações, modelo de isolamento de processos e filosofia Zero Memory State.*

2. [🛠️ **Stack Tecnológica & Racional (`TECH_STACK.md`)**](./TECH_STACK.md)  
   *Por que escolhemos SQLite WAL em vez de bancos remotos, por que centavos inteiros são inegociáveis e nossa visão sobre monólitos modulares de alta performance.*

3. [⚔️ **Padrão de Slash Command em 2 Camadas (`patterns/`)**](./patterns/slash-command-2-layer.md)  
   *O anti-padrão dos bots amadores vs o desacoplamento de Adapters de Apresentação e Serviços de Domínio Puros (com exemplo em código executável em [`patterns/slash-command-example.js`](./patterns/slash-command-example.js)).*

4. [🔒 **Segurança por Princípio (`security/`)**](./security/README.md)  
   *Demonstração dos 3 pilares criptográficos e defensivos com snippets autocontidos e verificados: Anti-XSS, Timing-Safe e Fail-Closed.*

---

## 🛡️ Filosofia de Transparência vs Código Proprietário

A Hellcore opera sob a premissa de que **qualidade e confiabilidade se demonstram através de princípios, métodos e consistência técnica**, e não pela exposição irresponsável de código-fonte de produção.

* **O que publicamos**: Nossos princípios de engenharia, especificações conceituais de arquitetura, padrões de design limpos e snippets defensivos testáveis.
* **O que protegemos**: Nosso código de negócio, bancos de dados reais, rotas internas, credenciais e topologia de servidores.

Acreditamos que a verdadeira segurança resiste à luz do dia: ela é construída com matemática, rigor e boas práticas.

---

<div align="center">

*Hellcore Engineering — Confiabilidade, performance e segurança sem concessões.*  
Desenvolvido com excelência por **HellDevs Studio**.

</div>
