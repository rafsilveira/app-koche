const { detectMissingGuideFields } = require('./missingFields');
const { normalizeText } = require('./scopeRules');

function normalizeVehicleField(value) {
  return normalizeText(String(value || ''));
}

function extractVehicleQuery(message, vehicles = []) {
  const text = normalizeText(message);

  return {
    brand: extractKnownBrand(text, vehicles),
    model: extractKnownModel(text, vehicles),
    year: extractYearValue(text),
    engine: extractKnownEngine(text, vehicles),
    transmission: extractTransmission(text)
  };
}

function extractKnownBrand(text, vehicles) {
  const match = extractCatalogValue(text, vehicles, 'brand');

  if (match) {
    return match;
  }

  const knownBrands = ['toyota', 'honda', 'ford', 'chevrolet', 'volkswagen', 'jeep', 'fiat', 'hyundai', 'nissan'];
  const fallback = knownBrands.find((brand) => containsCatalogTerm(text, brand));
  return fallback ? capitalize(fallback) : '';
}

function extractKnownModel(text, vehicles) {
  const match = extractCatalogValue(text, vehicles, 'model');

  if (match) {
    return match;
  }

  const knownModels = ['corolla', 'civic', 'hilux', 'compass', 'renegade', 'cruze', 'onix', 'toro'];
  const fallback = knownModels.find((model) => containsCatalogTerm(text, model));
  return fallback ? capitalize(fallback) : '';
}

function extractKnownEngine(text, vehicles) {
  const match = extractCatalogValue(text, vehicles, 'engine');

  if (match) {
    return match;
  }

  const displacementMatch = text.match(/\b\d\.\d\b/);
  return displacementMatch ? displacementMatch[0] : '';
}

function extractCatalogValue(text, vehicles, field) {
  const options = [];
  const seen = new Set();

  for (const vehicle of vehicles) {
    const rawValue = String(vehicle[field] || '').trim();
    const normalizedValue = normalizeVehicleField(rawValue);

    if (!normalizedValue || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    options.push({ rawValue, normalizedValue });
  }

  options.sort((left, right) => right.normalizedValue.length - left.normalizedValue.length);

  const match = options.find((option) => containsCatalogTerm(text, option.normalizedValue));
  return match ? match.rawValue : '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsCatalogTerm(text, value) {
  if (!value) {
    return false;
  }

  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(value)}(?=$|[^a-z0-9])`);
  return pattern.test(text);
}

function extractYearValue(text) {
  const rangeMatch = text.match(/\b(19\d{2}|20\d{2})\s*[-/]\s*(19\d{2}|20\d{2})\b/);

  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}`;
  }

  const exactMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
  return exactMatch ? exactMatch[1] : '';
}

function extractTransmission(text) {
  if (/\b(manual|mt)\b/.test(text)) {
    return 'manual';
  }

  if (/automatic|automatico|automatica|cvt/.test(text)) {
    return 'automatic';
  }

  return '';
}

function parseYearValue(value) {
  const normalizedValue = String(value || '').trim();
  const rangeMatch = normalizedValue.match(/^(19\d{2}|20\d{2})\s*[-/]\s*(19\d{2}|20\d{2})$/);

  if (rangeMatch) {
    return {
      start: Number(rangeMatch[1]),
      end: Number(rangeMatch[2])
    };
  }

  const exactMatch = normalizedValue.match(/^(19\d{2}|20\d{2})$/);

  if (exactMatch) {
    const year = Number(exactMatch[1]);
    return { start: year, end: year };
  }

  return null;
}

function yearsAreCompatible(vehicleYear, queryYear) {
  const vehicleRange = parseYearValue(vehicleYear);
  const queryRange = parseYearValue(queryYear);

  if (!vehicleRange || !queryRange) {
    return String(vehicleYear || '') === String(queryYear || '');
  }

  return vehicleRange.start <= queryRange.end && queryRange.start <= vehicleRange.end;
}

function extractEngineDisplacement(value) {
  const match = normalizeVehicleField(value).match(/\b\d\.\d\b/);
  return match ? match[0] : '';
}

function enginesAreCompatible(vehicleEngine, queryEngine) {
  const normalizedVehicleEngine = normalizeVehicleField(vehicleEngine);
  const normalizedQueryEngine = normalizeVehicleField(queryEngine);

  if (normalizedVehicleEngine === normalizedQueryEngine) {
    return true;
  }

  const vehicleDisplacement = extractEngineDisplacement(vehicleEngine);
  const queryDisplacement = extractEngineDisplacement(queryEngine);

  if (!vehicleDisplacement || !queryDisplacement || vehicleDisplacement !== queryDisplacement) {
    return false;
  }

  const extraQueryText = normalizedQueryEngine.replace(queryDisplacement, '').trim();
  return !extraQueryText || normalizedVehicleEngine.includes(extraQueryText);
}

function normalizeTransmissionValue(value) {
  const normalizedValue = normalizeVehicleField(value);

  if (!normalizedValue) {
    return '';
  }

  if (normalizedValue.includes('manual')) {
    return 'manual';
  }

  if (normalizedValue.includes('auto') || normalizedValue.includes('cvt')) {
    return 'automatic';
  }

  return normalizedValue;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function lookupVehicle(db, message) {
  const snapshot = await db.collection('vehicles').get();
  const vehicles = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
  const vehicleQuery = extractVehicleQuery(message, vehicles);
  const missingFields = detectMissingGuideFields(vehicleQuery);

  if (missingFields.length > 0) {
    return {
      status: 'missing_fields',
      vehicleQuery,
      missingFields
    };
  }

  const candidates = vehicles.filter((vehicle) => {
    return normalizeVehicleField(vehicle.brand) === normalizeVehicleField(vehicleQuery.brand)
      && normalizeVehicleField(vehicle.model) === normalizeVehicleField(vehicleQuery.model)
      && yearsAreCompatible(vehicle.year, vehicleQuery.year)
      && enginesAreCompatible(vehicle.engine, vehicleQuery.engine);
  });

  const transmissionCandidates = vehicleQuery.transmission
    ? candidates.filter((vehicle) => normalizeTransmissionValue(vehicle.transmission) === vehicleQuery.transmission)
    : candidates;

  const resolvedCandidates = (transmissionCandidates.length > 0 ? transmissionCandidates : candidates).slice(0, 2);

  if (resolvedCandidates.length === 0 || resolvedCandidates.length > 1) {
    return {
      status: 'no_match',
      vehicleQuery,
      missingFields: []
    };
  }

  return {
    status: 'match',
    vehicleQuery,
    missingFields: [],
    vehicle: resolvedCandidates[0]
  };
}

module.exports = {
  lookupVehicle,
  extractVehicleQuery
};
