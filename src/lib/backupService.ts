import { Store } from "@/hooks/useStore";
import { format } from "date-fns";

const BACKUP_PREFIX = "moneymind-backup-";
const BACKUP_METADATA_KEY = "moneymind-backup-metadata";
const MAX_LOCAL_BACKUPS = 10;

export interface BackupMetadata {
  id: string;
  timestamp: string;
  fileName: string;
  size: number;
}

/**
 * Create a backup of the current store
 */
export const createBackup = (store: Store): BackupMetadata => {
  const backupId = crypto.randomUUID();
  const backupData = JSON.stringify(store);
  const backupKey = `${BACKUP_PREFIX}${backupId}`;
  const timestamp = new Date().toISOString();
  const fileName = `MoneyMind_Backup_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.json`;

  // Store backup data
  try {
    localStorage.setItem(backupKey, backupData);
  } catch (e) {
    console.error("Failed to create backup:", e);
    throw new Error("Storage quota exceeded. Please clear some backups.");
  }

  // Update metadata
  const metadata: BackupMetadata = {
    id: backupId,
    timestamp,
    fileName,
    size: backupData.length,
  };

  addBackupMetadata(metadata);
  cleanupOldBackups();

  return metadata;
};

/**
 * Get all backups metadata
 */
export const getBackupsMetadata = (): BackupMetadata[] => {
  try {
    const data = localStorage.getItem(BACKUP_METADATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Get a specific backup
 */
export const getBackup = (backupId: string): Store | null => {
  try {
    const data = localStorage.getItem(`${BACKUP_PREFIX}${backupId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Get the most recent backup
 */
export const getLatestBackup = (): BackupMetadata | null => {
  const backups = getBackupsMetadata();
  return backups.length > 0 ? backups[0] : null;
};

/**
 * Delete a backup
 */
export const deleteBackup = (backupId: string): void => {
  localStorage.removeItem(`${BACKUP_PREFIX}${backupId}`);
  const backups = getBackupsMetadata();
  const updated = backups.filter((b) => b.id !== backupId);
  localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(updated));
};

/**
 * Check if auto-backup is enabled
 */
export const isAutoBackupEnabled = (): boolean => {
  return localStorage.getItem("moneymind-auto-backup-enabled") === "true";
};

/**
 * Enable/disable auto-backup
 */
export const setAutoBackupEnabled = (enabled: boolean): void => {
  localStorage.setItem("moneymind-auto-backup-enabled", enabled ? "true" : "false");
};

/**
 * Get the last auto-backup timestamp
 */
export const getLastAutoBackupTime = (): string | null => {
  return localStorage.getItem("moneymind-last-auto-backup");
};

/**
 * Check if 24 hours have passed since last backup
 */
export const shouldRunAutoBackup = (): boolean => {
  const lastTime = getLastAutoBackupTime();
  if (!lastTime) return true;

  const lastBackup = new Date(lastTime);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

  return hoursDiff >= 24;
};

/**
 * Record auto-backup timestamp
 */
export const recordAutoBackupTime = (): void => {
  localStorage.setItem("moneymind-last-auto-backup", new Date().toISOString());
};

/**
 * Export backup as JSON file (for download)
 */
export const exportBackupAsFile = (backupId: string, fileName: string): void => {
  const backup = getBackup(backupId);
  if (!backup) {
    throw new Error("Backup not found");
  }

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Private helper: Add backup metadata
 */
const addBackupMetadata = (metadata: BackupMetadata): void => {
  const backups = getBackupsMetadata();
  backups.unshift(metadata);
  localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(backups));
};

/**
 * Private helper: Clean up old backups (keep max 10)
 */
const cleanupOldBackups = (): void => {
  const backups = getBackupsMetadata();
  if (backups.length > MAX_LOCAL_BACKUPS) {
    const toDelete = backups.slice(MAX_LOCAL_BACKUPS);
    toDelete.forEach((b) => {
      localStorage.removeItem(`${BACKUP_PREFIX}${b.id}`);
    });
    const kept = backups.slice(0, MAX_LOCAL_BACKUPS);
    localStorage.setItem(BACKUP_METADATA_KEY, JSON.stringify(kept));
  }
};
