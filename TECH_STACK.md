# 🛠️ Stack Tecnológica & Racional de Engenharia — Hellcore

> **Análise aprofundada das tecnologias selecionadas para o ecossistema Hellcore, justificativas técnicas e os trade-offs assumidos.**

---

## ⚡ Visão Geral da Stack

| Componente | Tecnologia Adotada | Papel no Sistema |
| :--- | :--- | :--- |
| **Runtime** | **Node.js (v20+ LTS)** | Execução do loop de eventos assíncrono de alto desempenho |
| **Gateway de Mensageria** | **Discord.js (v14)** | Conexão WebSocket em tempo real com o Discord Gateway |
| **Banco de Dados & Ledger** | **SQLite (`better-sqlite3`)** | Armazenamento síncrono local em modo Write-Ahead Logging (WAL) |
| **Servidor Web & APIs** | **Express.js** | Servidor HTTP leve para Transcripts e Webhooks |
| **Criptografia & Assinaturas** | **Node.js `crypto` (Nativo)** | Hashing SHA-256, HMAC e comparações Timing-Safe |
| **Gerenciador de Processos** | **PM2** | Watchdog de processo, restart automático e gerenciamento de logs |

---

## 🔬 Racional das Escolhas Técnicas

### 1. SQLite (`better-sqlite3`) em Modo WAL vs Bancos de Dados Remotos (PostgreSQL/MySQL)

Uma das decisões de engenharia mais deliberadas na Hellcore foi a utilização do SQLite local através de drivers síncronos C++ nativos (`better-sqlite3`), operando em modo **WAL (Write-Ahead Logging)**.

#### Por que não um banco remoto tradicional?
* **Eliminação do Network Hop**: Em um banco remoto (como Postgres ou MySQL na nuvem), cada query consome entre 5ms e 25ms apenas em latência de rede (TCP handshake, TLS e trânsito de pacotes). Em operações no Discord, onde o timeout é de 3.000ms, perder 100ms em múltiplas queries encadeadas é inaceitável. Com `better-sqlite3`, consultas ocorrem em **menos de 0,1ms** via chamadas diretas de memória mapeada.
* **Leituras e Escritas Concorrentes sem Bloqueio**: No modo WAL, leitores nunca bloqueiam escritores e escritores nunca bloqueiam leitores. O dashboard web pode carregar relatórios pesados enquanto o bot registra dezenas de transações por segundo.
* **Transações ACID Atômicas Reais**: Ao contrário de arquivos JSON planos que podem corromper se o processo cair no meio da gravação, o SQLite oferece atomicidade matemática — ou a transação comita 100%, ou sofre rollback limpo.
* **Facilidade de Backup Snapshot**: Um backup completo e consistente do ecossistema pode ser gerado a qualquer instante através de snapshots atômicos de disco.

---

### 2. Centavos Inteiros (`Integer Cents`) vs Ponto Flutuante (`Float`)

Em qualquer software que transaciona valores monetários, a aritmética de ponto flutuante padrão (IEEE 754) é uma fonte clássica de bugs e perdas financeiras:

```javascript
// O perigo do ponto flutuante em JavaScript:
0.1 + 0.2 === 0.30000000000000004 // TRUE! (Quebra validações de igualdade estrita)
```

#### A Abordagem Hellcore:
* Todos os saldos, preços, taxas de intermediação e cupons são tratados obrigatoriamente como **números inteiros** representando centavos.
* Exemplo: R$ 49,90 é instanciado como `4990`.
* Multiplicações e subtrações operam sob aritmética inteira exata. O arredondamento (quando aplicável) ocorre por regras bancárias explícitas (`Math.round`), e a conversão para string formatada (`R$ 49,90`) só ocorre no momento da exibição visual.

---

### 3. Monólito Modular de Alta Velocidade vs Microserviços Prematuros

A arquitetura moderna costuma cair na armadilha de fatiar sistemas precocemente em dezenas de microserviços comunicando-se por gRPC ou RabbitMQ.

#### Por que adotamos um Monólito Modular?
1. **Consistência Transacional Imediata**: Em sistemas com mediação financeira e entrega de ativos virtuais, operações distribuídas exigem protocolos complexos de Two-Phase Commit (2PC) ou Saga Patterns, que introduzem latência e riscos de estados inconsistentes.
2. **Zero Overhead de Serialização**: Os módulos de Tickets, Transcripts, Ledger e Middleman comunicam-se em memória através de interfaces tipadas em nanossegundos, sem o custo de serializar/deserializar JSON via rede para outro container.
3. **Isolamento de Domínio Garantido**: A separação de pastas e camadas de serviço (Camada de Adapter vs Camada de Domínio) oferece a mesma separação conceitual de microserviços, mas sem o custo de infraestrutura.

---

### 4. Zero Dependências Externas em Camadas Críticas

Evitamos o inchaço de dependências (`dependency bloat`) adotando o princípio de priorizar as APIs nativas do Node.js:
* **Criptografia**: O módulo nativo `node:crypto` substitui bibliotecas externas para geração de UUIDs, hashes HMAC e comparações com tempo constante.
* **Utilitários de String & Sanitização**: Funções puras e leves sem necessidade de frameworks pesados de sanitização para renderizações estáticas.
* **Controle de Processos**: PM2 nativo para produção, eliminando a complexidade de orquestradores externos em ambientes dedicados de baixo footprint.

---

## 📈 Tabela Comparativa de Trade-offs

| Decisão Arquitetural | Alternativa Recusada | Vantagem Conquistada | Trade-off Aceito |
| :--- | :--- | :--- | :--- |
| **SQLite WAL Local** | Postgres Remoto | Latência de query < 0.1ms; zero risco de queda de rede com banco. | Exige escalabilidade vertical e replicação de disco para alta disponibilidade. |
| **Integer Cents** | Decimal / Float | Precisão matemática 100% à prova de imprecisões IEEE 754. | Exige atenção contínua dos desenvolvedores para nunca esquecer de multiplicar/dividir por 100. |
| **Padrão 2 Camadas** | Handlers Inline 1 Camada | Código desacoplado e 100% testável fora do Discord. | Mais arquivos e linhas estruturadas por comando implementado. |
| **Fail-Closed Gate** | Fail-Open Fallback | Segurança máxima: nenhuma porta abre em caso de erro. | Usuário pode receber mensagem de indisponibilidade se a rede oscilar. |

---
*Hellcore Tech Stack — Engenharia pragmática orientada à máxima performance e confiabilidade inabalável.*
