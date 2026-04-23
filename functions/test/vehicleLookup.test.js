const test = require('node:test');
const assert = require('node:assert/strict');

const { lookupVehicle } = require('../src/assistant/vehicleLookup');

function createDbWithVehicles(vehicles) {
  return {
    collection(name) {
      assert.equal(name, 'vehicles');

      return {
        async get() {
          return {
            docs: vehicles.map((vehicle) => ({
              id: vehicle.id,
              data: () => vehicle
            }))
          };
        }
      };
    }
  };
}

test('lookupVehicle returns guide match for a complete vehicle query', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?');

  assert.equal(result.status, 'match');
  assert.equal(result.vehicle.id, 'veh-1');
});

test('lookupVehicle asks for missing year and engine when query is incomplete', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla automatico?');

  assert.equal(result.status, 'missing_fields');
  assert.deepEqual(result.vehicleQuery, {
    brand: 'Toyota',
    model: 'Corolla',
    year: '',
    engine: '',
    transmission: 'automatic'
  });
  assert.deepEqual(result.missingFields, ['year', 'engine']);
});

test('lookupVehicle returns no_match when extracted query has no compatible catalog result', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla 2020 2.0 automatico?');

  assert.equal(result.status, 'no_match');
  assert.deepEqual(result.vehicleQuery, {
    brand: 'Toyota',
    model: 'Corolla',
    year: '2020',
    engine: '2.0',
    transmission: 'automatic'
  });
  assert.deepEqual(result.missingFields, []);
});

test('lookupVehicle matches catalog vehicles without hardcoded brand or model lists', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-2', brand: 'Peugeot', model: '208', year: '2021', engine: '1.6' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Peugeot 208 2021 1.6 automatico?');

  assert.equal(result.status, 'match');
  assert.equal(result.vehicle.id, 'veh-2');
});

test('lookupVehicle uses transmission to choose the compatible candidate', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-manual', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0', transmission: 'manual' },
    { id: 'veh-auto', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0', transmission: 'automatic' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?');

  assert.equal(result.status, 'match');
  assert.equal(result.vehicle.id, 'veh-auto');
});

test('lookupVehicle avoids arbitrary match when catalog stays ambiguous without transmission', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-manual', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0', transmission: 'manual' },
    { id: 'veh-auto', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0', transmission: 'automatic' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla 2018 2.0?');

  assert.equal(result.status, 'no_match');
});

test('lookupVehicle matches catalog year ranges and richer engine text', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-3', brand: 'Audi', model: 'A4', year: '2015-2020', engine: '2.0 TFSI', transmission: 'automatic' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Audi A4 2018 2.0 automatico?');

  assert.equal(result.status, 'match');
  assert.equal(result.vehicle.id, 'veh-3');
});

test('lookupVehicle does not infer a short model from a larger token', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-4', brand: 'Audi', model: 'Q3', year: '2020', engine: '1.4' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Audi Q30 2020 1.4 automatico?');

  assert.equal(result.status, 'missing_fields');
  assert.deepEqual(result.missingFields, ['model']);
});

test('lookupVehicle keeps later transmission-specific matches when more than two candidates exist', async () => {
  const db = createDbWithVehicles([
    { id: 'veh-manual-1', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0', transmission: 'manual' },
    { id: 'veh-manual-2', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0', transmission: 'manual' },
    { id: 'veh-auto', brand: 'Toyota', model: 'Corolla', year: '2018', engine: '2.0', transmission: 'automatic' }
  ]);

  const result = await lookupVehicle(db, 'Qual o fluido do Toyota Corolla 2018 2.0 automatico?');

  assert.equal(result.status, 'match');
  assert.equal(result.vehicle.id, 'veh-auto');
});
