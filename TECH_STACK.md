# 🛠️ Stack Tecnológica & Racional de Engenharia — Hellcore

> **Análise aprofundada dos princípios tecnológicos adotados no ecossistema Hellcore, justificativas técnicas e os trade-offs assumidos.**

---

## ⚡ Visão Geral da Stack

| Componente | Abordagem Adotada | Papel no Sistema |
| :--- | :--- | :--- |
| **Runtime** | **Node.js (v20+ LTS)** | Execução do loop de eventos assíncrono de alto desempenho |
| **Gateway de Mensageria** | **Discord.js (v14)** | Conexão WebSocket em tempo real com o Discord Gateway |
| **Armazenamento & Transações** | **Banco Local Embutido com Garantias ACID** | Persistência síncrona local com atomicidade matemática contra falhas abruptas |
| **Servidor Web & APIs** | **Express.js** | Servidor HTTP leve para Webhooks de pagamento e ferramentas internas da Staff (Transcripts restritos e Dashboard interno) |
| **Criptografia & Assinaturas** | **Node.js `crypto` (Nativo)** | Hashing SHA-256, HMAC e comparações Timing-Safe |
| **Orquestração de Execução** | **Gerenciador de Processos com Watchdog** | Monitoramento contínuo de processo, recuperação automática e gestão de logs |

---

## 🔬 Racional das Escolhas Técnicas

### 1. Banco de Dados Local Embutido com Garantias ACID vs Bancos Remotos Tradicionais

Uma das decisões deliberadas na arquitetura da Hellcore foi priorizar armazenamento transacional local embutido com garantias ACID completas, em vez de depender de instâncias remotas de banco de dados para operações transacionais em tempo real.

#### Por que um banco local embutido?
* **Eliminação de Dependência de Rede (Network Hops)**: Em operações síncronas de bot onde timeouts de gateway são estritos, depender de conexões TCP remotas para validar estoques ou leases adiciona latência imprevisível e pontos críticos de falha. Com um motor local embutido, a persistência ocorre diretamente no subsistema de armazenamento local com latência mínima e previsível.
* **Leituras e Escritas Concorrentes sem Bloqueio**: A engine transacional adota mecanismos onde leituras isoladas não bloqueiam operações concorrentes de escrita, garantindo que rotinas administrativas internas da Staff consultem históricos e relatórios sem impactar a fluidez do atendimento no Discord.
* **Transações ACID Atômicas Reais**: Ao contrário de abordagens frágeis baseadas em arquivos JSON planos que podem corromper caso o processo encerre inesperadamente durante a escrita, transações ACID garantem atomicidade matemática — ou a transação é gravada e confirmada integralmente, ou sofre reversão limpa (*rollback*).
* **Consistência Instantânea de Estado**: Snapshots atômicos de disco garantem que backups do ecossistema reflitam o estado exato dos dados sem necessidade de paralisações operacionais.

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
* Multiplicações e subtrações operam sob aritmética inteira exata. O arredondamento (quando aplicável) ocorre por regras bancárias explícitas (`Math.round`), e a conversão para string formatada (`R$ 49,90`) só ocorre no momento final da renderização visual.

---

### 3. Coesão Arquitetural & Simplicidade Pragmática vs Complexidade Prematura

A arquitetura moderna frequentemente sofre da armadilha de fatiar sistemas precocemente em dezenas de microsserviços distribuídos, introduzindo sobrecarga operacional desnecessária.

#### Por que priorizamos Coesão de Domínio?
1. **Consistência Transacional Imediata**: Em sistemas com mediação financeira e entrega de ativos virtuais, operações distribuídas exigem protocolos complexos de coordenação que introduzem latência e risco de estados inconsistentes. Manter fronteiras transacionais coesas garante liquidação confiável de ponta a ponta.
2. **Comunicação Direta em Memória**: Módulos de Atendimento, Transcripts, Ledger e Mediação comunicam-se através de interfaces tipadas diretas, eliminando custos de serialização e desserialização de payloads de rede.
3. **Isolamento de Responsabilidade Garantido**: O desacoplamento estrito entre a Camada de Apresentação (*Interaction Adapter*) e a Camada de Regras de Negócio (*Domain Service*) oferece a mesma clareza arquitetural de serviços independentes, com máxima velocidade de execução.

---

### 4. Zero Dependências Externas em Camadas Críticas

Evitamos a sobrecarga de dependências desnecessárias (*dependency bloat*) priorizando as APIs nativas do ecossistema:
* **Criptografia**: O módulo nativo `node:crypto` substitui bibliotecas de terceiros para geração de identificadores, hashes HMAC e comparações em tempo constante.
* **Utilitários de String & Sanitização**: Funções puras e leves sem dependência de frameworks externos pesados para renderização e filtragem segura.
* **Ciclo de Vida do Processo**: Gerenciamento de ciclo de vida com watchdog ativo e reinicialização automática para tolerância a falhas sem introduzir orquestradores pesados.

---

## 📈 Tabela Comparativa de Trade-offs

| Decisão Arquitetural | Alternativa Recusada | Vantagem Conquistada | Trade-off Aceito |
| :--- | :--- | :--- | :--- |
| **Banco Local Embutido ACID** | Banco Remoto em Rede | Zero dependência de rede para transações; integridade atômica garantida. | Exige estratégias disciplinadas de snapshot e replicação de disco para alta disponibilidade. |
| **Integer Cents** | Decimal / Float | Precisão matemática 100% à prova de imprecisões IEEE 754. | Exige atenção contínua dos desenvolvedores para manter valores normalizados em centavos. |
| **Padrão 2 Camadas** | Handlers Inline 1 Camada | Código desacoplado e 100% testável fora do Discord. | Mais arquivos e linhas estruturadas por comando implementado. |
| **Fail-Closed Gate** | Fail-Open Fallback | Segurança máxima: nenhuma barreira abre em caso de erro. | Usuário pode receber mensagem de indisponibilidade se a rede oscilar. |

---
*Hellcore Tech Stack — Engenharia pragmática orientada à máxima performance e confiabilidade inabalável.*

