import React, { createContext, useContext, useState, useEffect } from 'react';
import { OfflineIncidentReport } from '../types/index.js';
import { saveOfflineReport, getPendingReports, getAllOfflineReports } from '../offline/db.js';
import { syncManager } from '../offline/syncManager.js';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  offlineReports: OfflineIncidentReport[];
  syncNow: () => Promise<void>;
  createOfflineEmergency: (report: Omit<OfflineIncidentReport, 'clientIncidentId' | 'createdAt' | 'syncStatus' | 'retryCount'>) => Promise<OfflineIncidentReport>;
  refreshOfflineData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [offlineReports, setOfflineReports] = useState<OfflineIncidentReport[]>([]);

  const refreshOfflineData = async () => {
    const all = await getAllOfflineReports();
    setOfflineReports(all);
    const pending = all.filter((r) => r.syncStatus === 'LOCAL_PENDING' || r.syncStatus === 'SYNC_FAILED');
    setPendingCount(pending.length);
  };

  useEffect(() => {
    refreshOfflineData();

    const handleOnline = () => {
      setIsOnline(true);
      refreshOfflineData();
      syncManager.triggerSync().then(() => refreshOfflineData());
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshOfflineData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = syncManager.subscribe((syncing, count) => {
      setIsSyncing(syncing);
      setPendingCount(count);
      refreshOfflineData();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const syncNow = async () => {
    await syncManager.triggerSync();
    await refreshOfflineData();
  };

  const createOfflineEmergency = async (
    data: Omit<OfflineIncidentReport, 'clientIncidentId' | 'createdAt' | 'syncStatus' | 'retryCount'>
  ): Promise<OfflineIncidentReport> => {
    const clientIncidentId = `resq-${crypto.randomUUID()}`;
    const newReport: OfflineIncidentReport = {
      ...data,
      clientIncidentId,
      createdAt: new Date().toISOString(),
      syncStatus: 'LOCAL_PENDING',
      retryCount: 0,
    };

    await saveOfflineReport(newReport);
    await refreshOfflineData();

    // If currently online, trigger sync immediately in the background
    if (navigator.onLine) {
      syncManager.triggerSync().then(() => refreshOfflineData());
    }

    return newReport;
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        offlineReports,
        syncNow,
        createOfflineEmergency,
        refreshOfflineData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
