// Princípio: se a verificação de permissão FALHA por qualquer motivo
// (rede, timeout, erro transitório), o acesso é NEGADO — nunca concedido.
// Dúvida em gate de segurança fecha a porta. Sempre.

async function verifyStaffAccess(userId, { fetchMember, hasStaffRole } = {}) {
  try {
    // Injeção de dependência / abstração do provedor de identidade
    if (typeof fetchMember !== 'function' || typeof hasStaffRole !== 'function') {
      throw new Error('Identity provider dependencies not provided');
    }

    const member = await fetchMember(userId);
    return Boolean(hasStaffRole(member)); // verificação real
  } catch (error) {
    console.warn('[ACCESS] verification failed — access denied');
    return false;                         // FAIL-CLOSED: erro = negado
  }
}

module.exports = { verifyStaffAccess };
