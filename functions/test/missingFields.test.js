const test = require('node:test');
const assert = require('node:assert/strict');

const { detectMissingGuideFields } = require('../src/assistant/missingFields');

test('detectMissingGuideFields asks for missing year and engine', () => {
  const result = detectMissingGuideFields({
    brand: 'Toyota',
    model: 'Corolla',
    year: '',
    engine: ''
  });

  assert.deepEqual(result, ['year', 'engine']);
});

test('detectMissingGuideFields returns empty array when required fields exist', () => {
  const result = detectMissingGuideFields({
    brand: 'Toyota',
    model: 'Corolla',
    year: '2018',
    engine: '2.0'
  });

  assert.deepEqual(result, []);
});
