import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineIncidentReport, LocalSyncStatus } from '../types/index.js';

interface ResQCloudDB extends DBSchema {
  offline_reports: {
    key: string;
    value: OfflineIncidentReport;
    indexes: {
      'by-syncStatus': LocalSyncStatus;
      'by-createdAt': string;
    };
  };
}

const DB_NAME = 'resqcloud_offline_store_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ResQCloudDB>> | null = null;

export const getDB = (): Promise<IDBPDatabase<ResQCloudDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<ResQCloudDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline_reports')) {
          const store = db.createObjectStore('offline_reports', {
            keyPath: 'clientIncidentId',
          });
          store.createIndex('by-syncStatus', 'syncStatus');
          store.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
};

export const saveOfflineReport = async (report: OfflineIncidentReport): Promise<void> => {
  const db = await getDB();
  await db.put('offline_reports', report);
};

export const getPendingReports = async (): Promise<OfflineIncidentReport[]> => {
  const db = await getDB();
  const all = await db.getAll('offline_reports');
  return all.filter((r) => r.syncStatus === 'LOCAL_PENDING' || r.syncStatus === 'SYNC_FAILED');
};

export const getAllOfflineReports = async (): Promise<OfflineIncidentReport[]> => {
  const db = await getDB();
  return db.getAll('offline_reports');
};

export const updateReportSyncStatus = async (
  clientIncidentId: string,
  syncStatus: LocalSyncStatus,
  serverId?: string,
  error?: string
): Promise<void> => {
  const db = await getDB();
  const existing = await db.get('offline_reports', clientIncidentId);
  if (existing) {
    existing.syncStatus = syncStatus;
    if (serverId) existing.serverId = serverId;
    if (error) existing.error = error;
    existing.lastAttemptAt = new Date().toISOString();
    if (syncStatus === 'SYNC_FAILED') {
      existing.retryCount = (existing.retryCount || 0) + 1;
    }
    await db.put('offline_reports', existing);
  }
};

export const deleteOfflineReport = async (clientIncidentId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('offline_reports', clientIncidentId);
};
