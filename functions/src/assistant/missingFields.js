function detectMissingGuideFields(query) {
  const missingFields = [];

  if (!query?.brand) {
    missingFields.push('brand');
  }

  if (!query?.model) {
    missingFields.push('model');
  }

  if (!query?.year) {
    missingFields.push('year');
  }

  if (!query?.engine) {
    missingFields.push('engine');
  }

  return missingFields;
}

module.exports = {
  detectMissingGuideFields
};
