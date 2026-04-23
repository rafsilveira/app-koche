const test = require('node:test');
const assert = require('node:assert/strict');

const { validateAssistantResponse } = require('../src/assistant/responseValidators');

test('validateAssistantResponse accepts guide_match payload with guideAction', () => {
  const result = validateAssistantResponse({
    type: 'guide_match',
    message: 'Encontrei um resultado compativel.',
    guideAction: {
      label: 'Abrir no Guia',
      vehicleId: 'abc123',
      brand: 'Toyota',
      model: 'Corolla',
      year: '2018',
      engine: '2.0'
    }
  });

  assert.equal(result.ok, true);
});

test('validateAssistantResponse rejects guide_match payload without guideAction', () => {
  const result = validateAssistantResponse({
    type: 'guide_match',
    message: 'Encontrei um resultado compativel.'
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /guideAction/i);
});

test('validateAssistantResponse rejects unsupported response types', () => {
  const result = validateAssistantResponse({
    type: 'free_form',
    message: 'teste'
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /type/i);
});

test('validateAssistantResponse rejects faq payloads that are obviously out of scope', () => {
  const result = validateAssistantResponse({
    type: 'faq',
    message: 'Aqui vai uma receita de bolo de cenoura com cobertura de chocolate.'
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /faq/i);
});

test('validateAssistantResponse rejects faq payloads that are too long', () => {
  const result = validateAssistantResponse({
    type: 'faq',
    message: 'A Koche Automotiva oferece suporte ao Guia de Transmissao. '.repeat(8).trim()
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /faq/i);
});
