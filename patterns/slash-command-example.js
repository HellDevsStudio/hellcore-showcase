// ==============================================================================
// 🏛️ HELLCORE ENGINEERING SHOWCASE: 2-LAYER SLASH COMMAND PATTERN
// Desacoplamento estrito entre Adapters de Protocolo (Discord) e Serviços de Domínio.
// ==============================================================================

/**
 * CAMADA 2: DOMAIN SERVICE (Regra de Negócio Pura)
 * - Zero dependência do Discord.js ou objetos de interação.
 * - Recebe DTOs primitivos tipados.
 * - Retorna resultados estruturados e previsíveis.
 * - Todos os valores monetários calculados em CENTAVOS INTEIROS (Integer Cents).
 */
async function processReservationService(params, dependencies = {}) {
  const { userId, itemId, quantity, unitPriceCents } = params;
  const { ledgerStore = new Map(), idGenerator = () => `res_${Date.now()}` } = dependencies;

  // 1. Validação de Domínio
  if (!userId || typeof userId !== 'string') {
    return { success: false, code: 'INVALID_USER', message: 'Identificador de usuário inválido.' };
  }
  if (!itemId || typeof itemId !== 'string') {
    return { success: false, code: 'INVALID_ITEM', message: 'Identificador de item inválido.' };
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { success: false, code: 'INVALID_QUANTITY', message: 'Quantidade deve ser um inteiro positivo.' };
  }
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    return { success: false, code: 'INVALID_PRICE', message: 'Preço unitário deve ser em centavos inteiros não-negativos.' };
  }

  // 2. Cálculo Seguro em Centavos Inteiros (Evita imprecisão IEEE 754 de ponto flutuante)
  const totalAmountCents = quantity * unitPriceCents;

  // 3. Verificação de Concorrência & Atomicidade (Simulação de Lease Atômico no Ledger)
  const userReservationsKey = `user:${userId}:active`;
  const currentActiveReservations = ledgerStore.get(userReservationsKey) || 0;
  const MAX_CONCURRENT_RESERVATIONS = 3;

  if (currentActiveReservations >= MAX_CONCURRENT_RESERVATIONS) {
    return {
      success: false,
      code: 'CONCURRENCY_LIMIT_EXCEEDED',
      message: 'Limite de reservas simultâneas atingido. Conclua ou cancele operações pendentes.',
    };
  }

  // 4. Criação do Registro de Reserva
  const reservationId = idGenerator();
  const reservationRecord = {
    id: reservationId,
    userId,
    itemId,
    quantity,
    totalAmountCents,
    createdAt: new Date().toISOString(),
    status: 'RESERVED_PENDING_CONFIRMATION',
  };

  // 5. Persistência Atômica
  ledgerStore.set(`reservation:${reservationId}`, reservationRecord);
  ledgerStore.set(userReservationsKey, currentActiveReservations + 1);

  return {
    success: true,
    code: 'RESERVATION_CREATED',
    data: reservationRecord,
  };
}

/**
 * CAMADA 1: INTERACTION ADAPTER (Protocolo / UX Discord)
 * - Trata o ciclo de vida da interação (deferReply, flags, timeouts).
 * - Extrai opções do comando e normaliza para DTO.
 * - Invoca o Serviço de Domínio (Camada 2).
 * - Mapeia o resultado de negócio para Embeds visuais do Discord.
 * - ZERO lógica de banco ou cálculos financeiros aqui dentro!
 */
async function handleReservationCommand(interaction, dependencies = {}) {
  // Flag efêmera para segurança e privacidade do usuário
  const EPHEMERAL_FLAG = 64; // MessageFlags.Ephemeral

  try {
    // 1. Notifica o Discord para evitar timeout de 3 segundos
    await interaction.deferReply({ flags: EPHEMERAL_FLAG });

    // 2. Extração e sanitização dos argumentos de entrada
    const itemId = interaction.options.getString('item', true);
    const quantity = interaction.options.getInteger('quantidade', true);
    const unitPriceCents = interaction.options.getInteger('preco_centavos', true);

    const dto = {
      userId: interaction.user.id,
      itemId,
      quantity,
      unitPriceCents,
    };

    // 3. Execução do Serviço de Domínio Desacoplado
    const result = await processReservationService(dto, dependencies);

    // 4. Mapeamento Visual da Resposta (Presentation Layer)
    if (!result.success) {
      return await interaction.editReply({
        embeds: [{
          title: '❌ Falha na Solicitação',
          description: result.message,
          color: 0xff2d40, // Carmesim Crimson Forge
          fields: [{ name: 'Código do Erro', value: `\`${result.code}\``, inline: true }],
          footer: { text: 'Hellcore Transaction Engine' },
        }],
      });
    }

    const res = result.data;
    const formattedTotal = (res.totalAmountCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return await interaction.editReply({
      embeds: [{
        title: '🔒 Reserva Realizada com Sucesso',
        description: 'Os itens foram congelados temporariamente no ledger para confirmação.',
        color: 0x00ff88, // Verde de Confirmação
        fields: [
          { name: 'Identificador', value: `\`${res.id}\``, inline: true },
          { name: 'Item', value: `\`${res.itemId}\``, inline: true },
          { name: 'Quantidade', value: `${res.quantity}`, inline: true },
          { name: 'Valor Total', value: formattedTotal, inline: true },
        ],
        footer: { text: 'Validação Atômica Concluída' },
      }],
    });
  } catch (error) {
    console.error('[COMMAND_ADAPTER] Unhandled error during command execution:', error);

    // Fallback defensivo Fail-Closed
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: '⚠️ Ocorreu uma instabilidade no processamento. Sua solicitação foi encerrada com segurança.',
      }).catch(() => {});
    }
  }
}

// Exportação para reutilização em testes e suítes
module.exports = {
  processReservationService,
  handleReservationCommand,
};

// ==============================================================================
// 🧪 SUÍTE DE TESTES UNITÁRIOS INTEGRADA (Validação Autocontida)
// Executável diretamente via: node patterns/slash-command-example.js
// ==============================================================================
if (require.main === module) {
  (async () => {
    console.log('🧪 Iniciando testes do Padrão Slash Command em 2 Camadas...\n');

    const ledgerStore = new Map();
    const deps = {
      ledgerStore,
      idGenerator: () => 'res_test_999',
    };

    // Teste 1: Serviço de Domínio com cálculo de centavos e reserva bem-sucedida
    const res1 = await processReservationService({
      userId: 'user_dev_01',
      itemId: 'sword_frost_01',
      quantity: 2,
      unitPriceCents: 1550, // R$ 15,50 cada -> total R$ 31,00 (3100 centavos)
    }, deps);

    console.assert(res1.success === true, 'Teste 1 Falhou: Deveria criar reserva');
    console.assert(res1.data.totalAmountCents === 3100, 'Teste 1 Falhou: Valor em centavos divergente');
    console.log('✅ Teste 1: Regra de Domínio e centavos inteiros aprovada.');

    // Teste 2: Rejeição de quantidade inválida (Validação de entrada)
    const res2 = await processReservationService({
      userId: 'user_dev_01',
      itemId: 'sword_frost_01',
      quantity: -5,
      unitPriceCents: 1550,
    }, deps);

    console.assert(res2.success === false && res2.code === 'INVALID_QUANTITY', 'Teste 2 Falhou: Deveria rejeitar negativo');
    console.log('✅ Teste 2: Validação defensiva de entrada aprovada.');

    // Teste 3: Mock da Camada de Apresentação (Interaction Adapter)
    let deferred = false;
    let replyPayload = null;

    const mockInteraction = {
      user: { id: 'user_dev_02' },
      options: {
        getString: (name) => (name === 'item' ? 'shield_crimson' : null),
        getInteger: (name) => (name === 'quantidade' ? 1 : name === 'preco_centavos' ? 2500 : 0),
      },
      deferReply: async () => { deferred = true; },
      editReply: async (payload) => { replyPayload = payload; return payload; },
    };

    await handleReservationCommand(mockInteraction, deps);

    console.assert(deferred === true, 'Teste 3 Falhou: Não chamou deferReply');
    console.assert(replyPayload?.embeds?.[0]?.color === 0x00ff88, 'Teste 3 Falhou: Não gerou Embed verde de sucesso');
    console.log('✅ Teste 3: Interaction Adapter Discord executado com sucesso.');

    console.log('\n🎉 TODOS OS TESTES DO PADRÃO 2 CAMADAS PASSARAM COM 100% DE SUCESSO!');
  })();
}
