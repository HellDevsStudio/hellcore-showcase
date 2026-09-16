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

module.exports = { safeCompare };
