import { getPendingReports, updateReportSyncStatus, getAllOfflineReports } from './db.js';
import { apiFetch, ApiError } from '../services/api.js';
import { OfflineIncidentReport } from '../types/index.js';

type SyncListener = (syncing: boolean, pendingCount: number, lastSyncTime?: string) => void;

class SyncManager {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private retryTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncManager] Browser transitioned to ONLINE state. Triggering sync.');
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        console.log('[SyncManager] Browser transitioned to OFFLINE state.');
        this.notifyListeners();
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notifyListeners();
    return () => this.listeners.delete(listener);
  }

  public async getPendingCount(): Promise<number> {
    const pending = await getPendingReports();
    return pending.length;
  }

  private async notifyListeners() {
    const pendingCount = await this.getPendingCount();
    for (const listener of this.listeners) {
      listener(this.isSyncing, pendingCount);
    }
  }

  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, errors: ['Sync already in progress'] };
    }

    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, errors: ['Browser reports offline'] };
    }

    const pending = await getPendingReports();
    if (pending.length === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    this.isSyncing = true;
    this.notifyListeners();

    const errors: string[] = [];
    let syncedCount = 0;

    try {
      // Mark items as SYNC_IN_PROGRESS in IndexedDB
      for (const item of pending) {
        await updateReportSyncStatus(item.clientIncidentId, 'SYNC_IN_PROGRESS');
      }

      // Send batch to backend
      const payload = {
        reports: pending.map((item) => ({
          clientIncidentId: item.clientIncidentId,
          disasterType: item.disasterType,
          title: item.title,
          description: item.description,
          affectedPeople: item.affectedPeople,
          medicalAssistanceRequired: item.medicalAssistanceRequired,
          peopleTrapped: item.peopleTrapped,
          severity: item.severity,
          locationDescription: item.locationDescription,
          latitude: item.latitude,
          longitude: item.longitude,
          region: item.region,
          createdAt: item.createdAt,
        })),
      };

      const response = await apiFetch('/incidents/sync', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response && response.results) {
        for (const resItem of response.results) {
          if (resItem.syncStatus === 'SERVER_RECEIVED') {
            await updateReportSyncStatus(
              resItem.clientIncidentId,
              'SERVER_RECEIVED',
              resItem.serverId
            );
            syncedCount++;
          } else {
            await updateReportSyncStatus(
              resItem.clientIncidentId,
              'SYNC_FAILED',
              undefined,
              resItem.error || 'Server rejected report'
            );
            errors.push(`${resItem.clientIncidentId}: ${resItem.error}`);
          }
        }
      }
    } catch (err: any) {
      console.warn('[SyncManager] Batch synchronization network error:', err);
      // Revert to SYNC_FAILED on network failure
      for (const item of pending) {
        await updateReportSyncStatus(
          item.clientIncidentId,
          'SYNC_FAILED',
          undefined,
          err.message || 'Network unreachable'
        );
      }
      errors.push(err.message || 'Network unreachable');

      // Schedule bounded exponential backoff
      this.scheduleRetry();
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { success: syncedCount > 0, syncedCount, errors };
  }

  private scheduleRetry() {
    if (this.retryTimeout) clearTimeout(this.retryTimeout);
    // Exponential retry bounded between 5s and 30s
    this.retryTimeout = setTimeout(() => {
      if (navigator.onLine) {
        this.triggerSync();
      }
    }, 10000);
  }
}

export const syncManager = new SyncManager();
