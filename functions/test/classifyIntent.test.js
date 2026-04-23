const test = require('node:test');
const assert = require('node:assert/strict');

const { classifyIntent } = require('../src/assistant/classifyIntent');

test('classifyIntent detects out-of-scope prompts', () => {
  const result = classifyIntent('Me ajude com marketing digital e anuncios');

  assert.equal(result.intent, 'out_of_scope');
  assert.equal(result.requiresGuideLookup, false);
});

test('classifyIntent treats empty prompts as out_of_scope', () => {
  const result = classifyIntent('   ');

  assert.equal(result.intent, 'out_of_scope');
  assert.equal(result.requiresGuideLookup, false);
});

test('classifyIntent detects Koche FAQ prompts', () => {
  const result = classifyIntent('O que e a Koche e quais produtos voces oferecem?');

  assert.equal(result.intent, 'faq');
  assert.equal(result.requiresGuideLookup, false);
});

test('classifyIntent keeps Koche prompts in faq scope', () => {
  const result = classifyIntent('Quais produtos da Koche voces oferecem para cambio automatico?');

  assert.equal(result.intent, 'faq');
  assert.equal(result.requiresGuideLookup, false);
});

test('classifyIntent sends generic off-topic prompts to out_of_scope', () => {
  const result = classifyIntent('Me passe uma receita de bolo de cenoura');

  assert.equal(result.intent, 'out_of_scope');
  assert.equal(result.requiresGuideLookup, false);
});

test('classifyIntent detects guide lookup prompts', () => {
  const result = classifyIntent('Qual fluido do Corolla 2018 2.0 automatico?');

  assert.equal(result.intent, 'guide_lookup');
  assert.equal(result.requiresGuideLookup, true);
});
