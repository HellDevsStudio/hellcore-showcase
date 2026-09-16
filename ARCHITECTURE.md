# 🏛️ Arquitetura do Sistema Hellcore — Visão de Engenharia

> **Documento de especificação técnica e arquitetura de alto nível do ecossistema transacional e operacional da Hellcore.**
> 
> **Nota de Acesso:** O painel web e os relatórios são ferramentas internas de gestão exclusivas da Staff. A interface pública de clientes é, hoje, exclusivamente o Discord. A expansão para uma plataforma web pública está em planejamento no roadmap.

---

## 🧭 Visão Geral da Topologia Sistêmica

A arquitetura da Hellcore foi projetada para resolver um desafio crítico: **operar transações de alta frequência e atendimento de clientes em tempo real com tolerância zero a perda de dados, duplicações ou travamentos de processo.**

O sistema opera sob uma arquitetura modular orientada a eventos, com desacoplamento rigoroso entre os canais de entrada (Discord Gateway para clientes, Webhooks HTTP de pagamento e Dashboard interno da Staff) e as regras de domínio transacionais.

```mermaid
flowchart TB
    subgraph Clients ["Pontos de Entrada e Atores"]
        U1["Membros / Clientes (Exclusivamente via Discord)"]
        U2["Gateways de Pagamento / Webhooks Externos"]
        U3["Staff / Painel Interno de Gestão (Restrito)"]
    end

    subgraph Ingress ["Camada de Roteamento & Adapters"]
        DGW["Discord.js Gateway WebSocket"]
        EXP["Express HTTP Web Server (Webhooks & Staff)"]
        AUTH["Auth Guards & Timing-Safe Validator"]
    end

    subgraph Core ["Camada de Serviços & Motores de Domínio"]
        TKT["Ticket & Vendas Engine"]
        ESC["Middleman Escrow / Mediação Engine"]
        TRX["Ledger Transacional & Idempotência"]
        TRS["Web Transcripts & Sanitization Pipeline"]
    end

    subgraph Persistence ["Camada de Persistência & Auditoria"]
        SQL[("Embedded Storage Engine (ACID Transactional)")]
        AUD["Structured Event Logs / Auditoria Gravada"]
    end

    U1 --> DGW
    U2 --> EXP
    U3 --> EXP

    DGW --> AUTH
    EXP --> AUTH

    AUTH --> TKT
    AUTH --> ESC
    AUTH --> TRX
    AUTH --> TRS

    TKT --> TRX
    ESC --> TRX

    TRX --> SQL
    TRS --> SQL
    TRX --> AUD
    TRS --> AUD

    style Clients fill:#090a0f,stroke:#4a5568,stroke-width:1px,color:#fff
    style Ingress fill:#11131b,stroke:#ff2d40,stroke-width:2px,color:#fff
    style Core fill:#181c28,stroke:#00ff88,stroke-width:2px,color:#fff
    style Persistence fill:#090a0f,stroke:#ff9900,stroke-width:2px,color:#fff
```

---

## 🛡️ Pilares Arquiteturais Fundamentais

### 1. Zero Memory State (Estado em Memória é Risco)
* **O Problema**: Em bots tradicionais, tickets abertos, saldos e carrinhos são mantidos em variáveis globais de memória (`const tickets = {}`). Se o processo reiniciar inesperadamente, sofrer manutenção ou cair por falta de energia, **todo o estado é corrompido ou perdido**.
* **A Regra Hellcore**: Nenhum estado de negócio existe exclusivamente na memória volátil. 
  - Toda transição de estado (abertura de ticket, reserva de item, confirmação de intermediação) é gravada **sincronamente em armazenamento local com garantias ACID** antes que a interface receba a confirmação.
  - Se o processo for encerrado abruptamente no meio de uma operação, o reinício reconstrói o estado com fidelidade atômica a partir do disco.

### 2. Idempotência Estrita & Leases Atômicos
* **O Problema**: Usuários com conexões lentas clicam repetidamente no botão de compra ou confirmação. Gateways de pagamento externos reenviam o mesmo webhook de confirmação até 5 vezes.
* **A Regra Hellcore**:
  - Toda ação de mutação exige uma chave de idempotência única (baseada em tupla índice+hash).
  - O primeiro processamento adquire um **Lease Atômico** no banco de dados via inserção atômica exclusiva no ledger.
  - Tentativas concorrentes no mesmo milissegundo colidem na restrição de unicidade e são descartadas graciosamente, impedindo criação de tickets duplicados ou entregas duplas de produtos.

### 3. Aritmética Financeira em Centavos Inteiros (`Integer Cents`)
* **O Problema**: O padrão de ponto flutuante IEEE 754 utilizado pelo JavaScript introduz imprecisões cumulativas (`0.1 + 0.2 === 0.30000000000000004`).
* **A Regra Hellcore**:
  - O uso de números decimais/floats para dinheiro é estritamente proibido.
  - Todos os valores são manipulados, calculados e persistidos em **centavos inteiros** (`R$ 10,50` é armazenado como `1050`).
  - A divisão por 100 ocorre exclusivamente no milissegundo final da renderização visual do texto.

### 4. Ciclo de Vida do Web Transcript Pipeline (Acesso Restrito & Sob Demanda)
Para garantir transparência, auditoria de disputas e conformidade legal em atendimentos e intermediações, a Hellcore possui um pipeline de transcripts web de alta segurança:

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff / Atendente
    actor Cliente as Cliente via Discord
    participant Bot as Gateway Discord
    participant Pipeline as Transcript Engine
    participant Sanitizer as Anti-XSS Sanitizer
    participant DB as Storage Engine (ACID)
    participant Web as Web Viewer Server Restrito

    Staff->>Bot: Solicita encerramento do Ticket / Mediação
    Bot->>Pipeline: Extrai histórico de mensagens e anexos
    Pipeline->>Sanitizer: Executa higienização estrita de tags HTML e caracteres hostis
    Sanitizer-->>Pipeline: Payload sanitizado seguro
    Pipeline->>DB: Persiste snapshot imutável em disco
    Pipeline-->>Bot: Registra fechamento auditado
    Note over Staff,Web: Visualização Interna da Staff
    Staff->>Web: Acessa histórico via sessão autenticada de Staff
    opt Cópia Solicitada pelo Cliente
        Staff->>Bot: Gera chave temporária de acesso sob demanda
        Bot-->>Cliente: Entrega link seguro temporário com chave criptográfica
        Cliente->>Web: Acessa transcrição temporária (modo somente-leitura)
    end
```

---

## 🔒 Modelo de Isolamento & Segurança em Camadas

| Camada | Mecanismo de Defesa | Objetivo |
| :--- | :--- | :--- |
| **Borda / Web** | Validação de Assinatura Timing-Safe (`crypto.timingSafeEqual`) | Anula ataques de inferência de chaves de API e webhooks. |
| **Rotas de Mutação** | Middlewares Obrigatórios (`checkAuthAdmin`, `checkAuthClient`) | Garante que nenhuma ação crítica ocorra sem sessão autenticada. |
| **Interface / Discord** | Flags Efêmeras (`MessageFlags.Ephemeral`) + Tuplas Seguras | Protege a privacidade de dados do cliente contra visualização por terceiros no canal. |
| **Renderização Web** | Sanitização Nativa Universal (`escapeHtml`) | Impede execução de scripts maliciosos (Cross-Site Scripting) em visualizações web. |
| **Controle de Acesso** | Arquitetura *Fail-Closed* | Qualquer exceção de conectividade em checagens de cargo nega o privilégio sumariamente. |

---

## 📊 Métricas Arquiteturais de Escala

* **Throughput de Eventos**: Capaz de processar centenas de interações concorrentes no Discord Gateway sem degradação perceptível de loop de eventos.
* **Responsividade Desacoplada**: Resposta defensiva imediata via defer efêmero de alta prioridade na camada de adapter.
* **Atomicidade de Armazenamento**: Persistência transacional com garantias ACID assegura leituras isoladas concorrentes com escritas atômicas e proteção contra restarts.
* **Auditoria Contínua**: 100% dos eventos administrativos e transacionais gravam o identificador da autoridade responsável, carimbo de data/hora UTC e dados contextuais.

---
*Hellcore System Architecture — Engenharia de software aplicada à confiabilidade de missão crítica.*
