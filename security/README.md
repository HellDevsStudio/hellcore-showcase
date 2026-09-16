# 🔒 Segurança na Hellcore — Como tratamos os seus dados

> **Não publicamos o código-fonte integral do sistema — ele é proprietário.**  
> **Mas publicamos os PRINCÍPIOS inegociáveis que governam cada linha dele.**

---

## 🎯 O que esta página é (e o que não é)

Esta página apresenta **trechos reais, simplificados e anonimizados** dos padrões de segurança que governam a Hellcore.

- **O que é**: Uma prestação de contas técnica e conceitual para clientes, membros da comunidade e desenvolvedores que desejam compreender a seriedade da nossa engenharia de proteção de dados.
- **O que não é**: Não é um repositório de implementação de produto, nem contém regras de negócio ou estrutura interna do bot.

Acreditamos que **segurança de verdade não depende de obscurantismo cego**. A robustez de um sistema se prova quando seus princípios fundamentais continuam inquebráveis mesmo quando explicados abertamente.

---

## 🛡️ Os 3 Princípios Fundamentais (com Código Real)

### 1. Toda entrada de usuário é escapada (Defesa Anti-XSS)

> **Princípio:** NADA que venha de um usuário toca o HTML ou interfaces renderizadas sem passar por higienização estrita.

#### O Código:
```javascript
// Princípio: NADA de dado de usuário toca HTML sem passar por aqui.
// Nomes de usuário do Discord podem conter qualquer caractere — 
// incluindo aqueles que viram código quando renderizados.

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}
```

#### Por que isso importa (em português claro):
* **O que é XSS (Cross-Site Scripting)?** É quando um invasor insere caracteres especiais (como `<script>` ou aspas) no nome de usuário, mensagem ou comprovante. Se o sistema apenas colar esse texto na tela, o navegador interpreta como instrução de código e pode roubar sessões de administradores.
* **Por que importa na Hellcore?** Plataformas como Discord aceitam nomes, apelidos e mensagens com qualquer caractere Unicode ou tags HTML disfarçadas. Em visualizações web de atendimento ou recibos, isso é vetor crítico.
* **O que a função impede?** Transforma caracteres de controle em entidades inofensivas de texto (`<` vira `&lt;`, `"` vira `&quot;`). O texto é lido normalmente pelos olhos humanos, mas o navegador nunca o executa como código.

---

### 2. Comparações de segredos são Timing-Safe (Anti-Timing Attack)

> **Princípio:** A comparação de chaves de API, webhooks e tokens de autenticação NUNCA revela segredos pela velocidade da resposta.

#### O Código:
```javascript
// Princípio: a comparação de chaves/segredos nunca revela, pelo TEMPO
// de execução, qual caractere foi o primeiro a divergir.
// Diferença de tamanho também é tratada silenciosamente.

const crypto = require('crypto');

function safeCompare(provided, stored) {
  try {
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(stored));
    return crypto.timingSafeEqual(a, b); // lança se tamanhos diferem
  } catch {
    return false; // tamanho diferente = negado, sem explicar qual
  }
}
```

#### Por que isso importa (em português claro):
* **O que é um Timing Attack?** Operadores comuns de comparação (como `a === b`) param a verificação no primeiro caractere diferente. Se o primeiro caractere estiver certo, a resposta demora alguns nanossegundos a mais do que se estivesse errado. Medindo esse tempo em milhares de requisições, um invasor consegue adivinhar senhas caractere por caractere — como um arrombador ouvindo o estalo dos pinos de um cofre.
* **Por que a diferença de tamanho é silenciada?** A função nativa de criptografia falha se os dois buffers tiverem comprimentos diferentes. Nosso bloco `catch` intercepta esse erro e responde imediatamente um `false` neutro, sem informar se o problema foi tamanho, formato ou valor.
* **O que a função garante?** A verificação de chaves e assinaturas leva exatamente o mesmo tempo de processamento, independentemente de onde o invasor errou, eliminando qualquer vazamento de informação por tempo de resposta.

---

### 3. Na dúvida, a porta fecha (Fail-Closed)

> **Princípio:** Se uma verificação de permissão falha por qualquer motivo imprevisto (queda de rede, timeout, banco temporariamente ocupado), o acesso é sumariamente NEGADO.

#### O Código:
```javascript
// Princípio: se a verificação de permissão FALHA por qualquer motivo
// (rede, timeout, erro transitório), o acesso é NEGADO — nunca concedido.
// Dúvida em gate de segurança fecha a porta. Sempre.

async function verifyStaffAccess(userId) {
  try {
    const member = await fetchMember(userId);
    return hasStaffRole(member);      // verificação real
  } catch (error) {
    console.warn('[ACCESS] verification failed — access denied');
    return false;                     // FAIL-CLOSED: erro = negado
  }
}
```

#### Por que isso importa (em português claro):
* **O que é o padrão Fail-Closed (Falha Fechada)?** Na engenharia de segurança, existem dois caminhos quando algo quebra: *Fail-Open* (a catraca abre para não travar o fluxo) ou *Fail-Closed* (a porta do cofre tranca e ninguém passa). Em segurança financeira e administrativa, sistemas *Fail-Open* são catastróficos.
* **O que acontece em caso de falha transitória?** Se a API externa oscilar ou ocorrer timeout enquanto o sistema checa se quem está clicando é um moderador, o sistema NUNCA assume "talvez seja". A resposta padrão é negar o privilégio.
* **O que a função garante?** O privilégio só existe quando a autorização for confirmada de ponta a ponta com 100% de sucesso. Em qualquer outro cenário — erro, timeout ou anomalia — a resposta é `false`.

---

## 📋 Compromissos de Segurança da Hellcore (Resumo Executivo)

| Diretriz | Como é implementada na prática |
| :--- | :--- |
| **Sanitização Universal** | Toda entrada enviada por usuários é tratada como potencialmente hostil e higienizada antes de qualquer renderização. |
| **Comparação Criptográfica Timing-Safe** | Tokens, webhooks e segredos são comparados com tempo constante para anular ataques analíticos. |
| **Arquitetura Fail-Closed** | Toda barreira de acesso e validação de permissões falha trancando a porta, nunca liberando. |
| **Validação Server-to-Server** | Transações e confirmações financeiras são atestadas diretamente entre servidores, sem intermediários no cliente. |
| **Trilha de Auditoria com Identificação** | Registros de ações críticas gravam o identificador da autoridade responsável, data e contexto. |
| **Defesa de Privacidade** | Nenhum dado confidencial de clientes, endereços de banco ou tokens são armazenados ou expostos em repositórios públicos. |

---

## 🧱 O que NÃO publicamos (e por quê)

O sistema de operações da Hellcore é resultado de meses de pesquisa, desenvolvimento e refatoração contínua. Nós **não** publicamos:

1. **Códigos de regras de negócio internas** — orquestradores de automação, fluxos específicos de estoque ou mecânicas operacionais.
2. **Topologia de infraestrutura** — variáveis de ambiente, nomes de instâncias, endereços de rede ou esquemas de banco de dados.
3. **Bibliotecas proprietárias completas** — o sistema é modular e protegido por direitos de autor e propriedade intelectual.

Publicamos com orgulho estes **PRINCÍPIOS**, pois a transparência que valoriza o cliente consiste em demonstrar como cuidamos da sua segurança — e não em desarmar as defesas da aplicação.

---
*Hellcore Security Engineering — Confiança construída com princípios matemáticos e boas práticas de engenharia.*
