function createOutOfScopeFallback() {
  return {
    type: 'out_of_scope',
    message: 'Posso ajudar apenas com informacoes sobre a Koche e consultas do Guia de Transmissao. Se quiser, faca uma pergunta sobre um veiculo, produto ou procedimento relacionado ao guia.'
  };
}

function createUsageBlockedFallback(message) {
  return {
    type: 'usage_blocked',
    message: message || 'O uso do assistente esta temporariamente indisponivel para sua conta. Consulte o Guia de Transmissao ou entre em contato com a Koche para suporte.'
  };
}

function createFaqFallback() {
  return {
    type: 'error',
    message: 'Posso ajudar apenas com informacoes verificadas sobre a Koche e o Guia de Transmissao. No momento, tente reformular sua pergunta ou consulte o Guia de Transmissao.'
  };
}

function createErrorFallback() {
  return {
    type: 'error',
    message: 'Nao foi possivel processar sua solicitacao agora. Tente novamente em instantes ou use o Guia de Transmissao.'
  };
}

module.exports = {
  createOutOfScopeFallback,
  createUsageBlockedFallback,
  createFaqFallback,
  createErrorFallback
};
