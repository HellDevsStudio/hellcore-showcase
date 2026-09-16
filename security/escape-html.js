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

module.exports = { escapeHtml };
