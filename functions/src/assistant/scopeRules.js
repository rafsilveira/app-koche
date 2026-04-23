const GUIDE_HINTS = [
  'fluido',
  'oleo',
  'óleo',
  'transmiss',
  'cambio',
  'câmbio',
  'corolla',
  'hilux',
  'civic',
  'motor',
  'ano',
  'guia'
];

const FAQ_HINTS = [
  'koche',
  'kóche',
  'empresa',
  'produto',
  'produtos',
  'faq',
  'marca',
  'catalogo',
  'catálogo'
];

const OUT_OF_SCOPE_HINTS = [
  'marketing',
  'facebook ads',
  'google ads',
  'instagram',
  'trafego pago',
  'tráfego pago',
  'politica',
  'política',
  'receita de bolo',
  'criptomoeda'
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function includesAny(text, hints) {
  return hints.some((hint) => text.includes(normalizeText(hint)));
}

module.exports = {
  GUIDE_HINTS,
  FAQ_HINTS,
  OUT_OF_SCOPE_HINTS,
  normalizeText,
  includesAny
};
