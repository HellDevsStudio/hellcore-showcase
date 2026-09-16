# 📐 Padrões de Engenharia — Hellcore Architecture Patterns

Bem-vindo à seção de **Padrões de Engenharia de Software** da Hellcore.

Aqui documentamos os princípios arquiteturais e convenções de código que diferenciam sistemas corporativos e transacionais de scripts amadores.

---

## 🧭 Padrões Documentados

### 1. [⚔️ Padrão de Slash Command em 2 Camadas](./slash-command-2-layer.md)
* **Problema Resolvido**: Desacoplamento entre o protocolo do Discord (`Interaction Adapter`) e as regras de negócio puras (`Domain Service`).
* **Código Demonstrativo**: [`slash-command-example.js`](./slash-command-example.js) (Autocontido e testável via `node patterns/slash-command-example.js`).
* **Benefícios**: Testabilidade unitária sem mocks do Discord, cálculos financeiros à prova de falhas com centavos inteiros e reaproveitamento do mesmo serviço para APIs internas da Staff e Webhooks.

---

## 🔒 Princípios Transversais

Todos os padrões implementados na Hellcore seguem três diretrizes universais:
1. **Isolamento de Efeitos Colaterais**: Lógica de domínio é expressa através de funções puras e determinísticas.
2. **Atomicidade e Idempotência**: Nenhuma operação financeira ou de estoque ocorre sem proteção contra concorrência e duplo processamento.
3. **Fail-Closed**: Na presença de qualquer anomalia de transporte ou validação, a execução é encerrada com estado seguro.
