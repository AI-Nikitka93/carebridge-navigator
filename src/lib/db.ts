import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import type { CareIntake, CareResource } from '../domain/careTypes';

// Add plugins if needed (e.g. for observables, encryption, etc)
// import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
// addRxPlugin(RxDBDevModePlugin);

export type MyDatabase = any; // You can define exact types if needed

const intakeSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    householdCode: { type: 'string' },
    ageGroup: { type: 'string' },
    concerns: { type: 'array', items: { type: 'string' } },
    barriers: { type: 'array', items: { type: 'string' } },
    warningSigns: { type: 'array', items: { type: 'string' } },
    distanceKm: { type: 'number' },
    hasPhoneAccess: { type: 'boolean' },
    preferredLanguage: { type: 'string' },
    consentToStore: { type: 'boolean' }
  },
  required: ['id']
};

const resourceSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    type: { type: 'string' },
    description: { type: 'string' },
    distance: { type: 'number' },
    phone: { type: 'string' },
    address: { type: 'string' },
    hours: { type: 'string' },
    services: { type: 'array', items: { type: 'string' } },
    languages: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'name', 'type', 'distance']
};

let dbPromise: Promise<MyDatabase> | null = null;

export async function getDb(): Promise<MyDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase({
    name: 'carebridgedb',
    storage: getRxStorageDexie(),
    ignoreDuplicate: true,
  }).then(async (db) => {
    await db.addCollections({
      intakes: {
        schema: intakeSchema
      },
      resources: {
        schema: resourceSchema
      }
    });
    return db;
  });

  return dbPromise;
}
